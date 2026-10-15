# ==============================================================================
# Receipt Scanning Pipeline Module - S3, SQS (with DLQ), Textract, Lambda
# ==============================================================================

data "aws_caller_identity" "current" {}

resource "random_id" "receipts_suffix" {
  byte_length = 4
}

# ------------------------------------------------------------------------------
# 1. Private S3 Receipts Bucket
# ------------------------------------------------------------------------------
resource "aws_s3_bucket" "receipts" {
  bucket        = "finsight-receipts-${var.environment}-${random_id.receipts_suffix.hex}"
  force_destroy = var.environment == "dev"

  tags = {
    Name        = "finsight-receipts-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "receipts" {
  bucket = aws_s3_bucket.receipts.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = var.kms_key_arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "receipts" {
  bucket = aws_s3_bucket.receipts.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_cors_configuration" "receipts" {
  bucket = aws_s3_bucket.receipts.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["PUT", "GET", "HEAD"]
    allowed_origins = var.allowed_origins
    expose_headers  = ["ETag"]
    max_age_seconds = 3600
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "receipts" {
  bucket = aws_s3_bucket.receipts.id

  rule {
    id     = "expire-receipts"
    status = "Enabled"

    filter {
      prefix = "receipts/"
    }

    expiration {
      days = var.retention_days
    }
  }
}

# ------------------------------------------------------------------------------
# 2. SQS Queue & Dead Letter Queue (DLQ)
# ------------------------------------------------------------------------------
resource "aws_sqs_queue" "dlq" {
  name                      = "finsight-receipt-dlq-${var.environment}"
  message_retention_seconds = 1209600 # 14 days

  tags = {
    Name        = "finsight-receipt-dlq-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_sqs_queue" "main" {
  name                       = "finsight-receipt-queue-${var.environment}"
  visibility_timeout_seconds = 180 # Allows Lambda 120s execution time plus buffer
  message_retention_seconds  = 345600

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq.arn
    maxReceiveCount     = 3
  })

  tags = {
    Name        = "finsight-receipt-queue-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_sqs_queue_policy" "main" {
  queue_url = aws_sqs_queue.main.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowS3ToPublishEvents"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action   = "sqs:SendMessage"
        Resource = aws_sqs_queue.main.arn
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_s3_bucket.receipts.arn
          }
        }
      }
    ]
  })
}

# S3 Event Notification to SQS Queue
resource "aws_s3_bucket_notification" "receipt_upload" {
  bucket     = aws_s3_bucket.receipts.id
  depends_on = [aws_sqs_queue_policy.main]

  queue {
    queue_arn     = aws_sqs_queue.main.arn
    events        = ["s3:ObjectCreated:*"]
    filter_prefix = "receipts/"
  }
}

# CloudWatch Alarm for DLQ > 0 messages
resource "aws_cloudwatch_metric_alarm" "dlq_messages" {
  alarm_name          = "finsight-receipt-dlq-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 60
  statistic           = "Maximum"
  threshold           = 0
  alarm_description   = "Triggers when receipt processing failures accumulate in the SQS DLQ"
  alarm_actions       = [var.sns_alerts_topic_arn]
  ok_actions          = [var.sns_alerts_topic_arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    QueueName = aws_sqs_queue.dlq.name
  }

  tags = {
    Environment = var.environment
  }
}

# ------------------------------------------------------------------------------
# 3. Lambda Receipt Scanner Function
# ------------------------------------------------------------------------------
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../../lambda/receipt_scanner"
  output_path = "${path.module}/../../lambda/receipt_scanner.zip"
}

resource "aws_iam_role" "lambda" {
  name = "finsight-receipt-lambda-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Environment = var.environment
  }
}

resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/finsight-receipt-scanner-${var.environment}"
  retention_in_days = 14

  tags = {
    Environment = var.environment
  }
}

resource "aws_iam_policy" "lambda_policy" {
  name        = "finsight-receipt-lambda-policy-${var.environment}"
  description = "Scoped permissions for receipt scanning Lambda (SQS, S3, KMS, Textract, Logs)"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "CloudWatchLogs"
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.lambda.arn}:*"
      },
      {
        Sid    = "SQSConsume"
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.main.arn
      },
      {
        Sid    = "S3ReadReceipts"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion"
        ]
        Resource = "${aws_s3_bucket.receipts.arn}/*"
      },
      {
        Sid    = "KMSDecrypt"
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey*"
        ]
        Resource = var.kms_key_arn
      },
      {
        Sid    = "TextractAnalyzeExpense"
        Effect = "Allow"
        Action = [
          "textract:AnalyzeExpense"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_attach" {
  role       = aws_iam_role.lambda.name
  policy_arn = aws_iam_policy.lambda_policy.arn
}

resource "aws_lambda_function" "scanner" {
  function_name    = "finsight-receipt-scanner-${var.environment}"
  description      = "Asynchronously scans receipts from S3 using Textract AnalyzeExpense"
  role             = aws_iam_role.lambda.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  timeout          = 120
  memory_size      = 512

  environment {
    variables = {
      ENVIRONMENT = var.environment
      AWS_REGION  = var.aws_region
      MONGO_URI   = var.mongo_uri
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.lambda,
    aws_iam_role_policy_attachment.lambda_attach
  ]

  tags = {
    Name        = "finsight-receipt-scanner-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_lambda_event_source_mapping" "sqs_trigger" {
  event_source_arn = aws_sqs_queue.main.arn
  function_name    = aws_lambda_function.scanner.arn
  batch_size       = 1
  enabled          = true
}
