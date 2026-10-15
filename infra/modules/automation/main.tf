# ==============================================================================
# Automation & Smart Features Module - Bedrock, EventBridge, SES, SNS, UPI Ingestion
# ==============================================================================

data "aws_caller_identity" "current" {}

# ------------------------------------------------------------------------------
# 1. Amazon SNS Events Topic (Event Fan-out)
# ------------------------------------------------------------------------------
resource "aws_sns_topic" "events" {
  name = "finsight-events-${var.environment}"

  tags = {
    Name        = "finsight-events-${var.environment}"
    Environment = var.environment
  }
}

# ------------------------------------------------------------------------------
# 2. Amazon SES Email Templates (Invites, Settle-up, Monthly Digest)
# ------------------------------------------------------------------------------
resource "aws_ses_template" "trip_invite" {
  name    = "FinSightTripInvite-${var.environment}"
  subject = "You've been invited to join {{tripName}} on FinSight"
  html    = "<h1>Join {{tripName}}</h1><p>Hi {{memberName}},</p><p>{{inviterName}} invited you to split expenses on FinSight. Click <a href='{{inviteUrl}}'>here</a> to view the group.</p>"
  text    = "Hi {{memberName}}, {{inviterName}} invited you to join {{tripName}} on FinSight: {{inviteUrl}}"
}

resource "aws_ses_template" "settle_up" {
  name    = "FinSightSettleUp-${var.environment}"
  subject = "Settle-up reminder for {{tripName}}"
  html    = "<h2>Trip Settlement Reminder</h2><p>Hi {{memberName}}, you have a pending settlement balance of {{amount}} in {{tripName}}. Visit FinSight to record or settle your share.</p>"
  text    = "Hi {{memberName}}, you have a pending settlement balance of {{amount}} in {{tripName}}."
}

resource "aws_ses_template" "monthly_summary" {
  name    = "FinSightMonthlySummary-${var.environment}"
  subject = "Your {{month}} Spending Summary on FinSight"
  html    = "<h2>FinSight Monthly Digest</h2><p>Here is your financial summary for {{month}}:</p><p>Total Spent: {{totalSpent}}</p><p>Top Category: {{topCategory}}</p>"
  text    = "FinSight {{month}} Digest: Total Spent: {{totalSpent}}, Top Category: {{topCategory}}"
}

# ------------------------------------------------------------------------------
# 3. Trip-Mode UPI Drafts: Lambda Ingestion & HTTP API Gateway
# ------------------------------------------------------------------------------
data "archive_file" "upi_drafts_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../../lambda/upi_drafts"
  output_path = "${path.module}/../../lambda/upi_drafts.zip"
}

resource "aws_iam_role" "upi_drafts_lambda" {
  name = "finsight-upi-drafts-role-${var.environment}"

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

resource "aws_cloudwatch_log_group" "upi_drafts" {
  name              = "/aws/lambda/finsight-upi-drafts-${var.environment}"
  retention_in_days = 14

  tags = {
    Environment = var.environment
  }
}

resource "aws_iam_policy" "upi_drafts_policy" {
  name = "finsight-upi-drafts-policy-${var.environment}"

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
        Resource = "${aws_cloudwatch_log_group.upi_drafts.arn}:*"
      },
      {
        Sid    = "BedrockInvoke"
        Effect = "Allow"
        Action = [
          "bedrock:InvokeModel"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "upi_drafts_attach" {
  role       = aws_iam_role.upi_drafts_lambda.name
  policy_arn = aws_iam_policy.upi_drafts_policy.arn
}

resource "aws_lambda_function" "upi_drafts" {
  function_name    = "finsight-upi-drafts-${var.environment}"
  description      = "Ingests incoming UPI payment drafts and cleans merchant strings via Amazon Bedrock"
  role             = aws_iam_role.upi_drafts_lambda.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  filename         = data.archive_file.upi_drafts_zip.output_path
  source_code_hash = data.archive_file.upi_drafts_zip.output_base64sha256
  timeout          = 15
  memory_size      = 256

  environment {
    variables = {
      ENVIRONMENT      = var.environment
      AWS_REGION       = var.aws_region
      MONGO_URI        = var.mongo_uri
      BEDROCK_MODEL_ID = var.bedrock_model_id
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.upi_drafts,
    aws_iam_role_policy_attachment.upi_drafts_attach
  ]

  tags = {
    Name        = "finsight-upi-drafts-${var.environment}"
    Environment = var.environment
  }
}

# HTTP API Gateway for Webhook / External Draft Ingestion
resource "aws_apigatewayv2_api" "upi" {
  name          = "finsight-upi-api-${var.environment}"
  protocol_type = "HTTP"

  cors_configuration {
    allow_headers = ["*"]
    allow_methods = ["POST", "OPTIONS"]
    allow_origins = ["*"]
    max_age       = 3600
  }

  tags = {
    Name        = "finsight-upi-api-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_apigatewayv2_stage" "upi_default" {
  api_id      = aws_apigatewayv2_api.upi.id
  name        = "$default"
  auto_deploy = true

  tags = {
    Environment = var.environment
  }
}

resource "aws_apigatewayv2_integration" "upi" {
  api_id                 = aws_apigatewayv2_api.upi.id
  integration_type       = "AWS_PROXY"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.upi_drafts.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "upi_drafts" {
  api_id    = aws_apigatewayv2_api.upi.id
  route_key = "POST /upi/drafts"
  target    = "integrations/${aws_apigatewayv2_integration.upi.id}"
}

resource "aws_lambda_permission" "apigw_upi" {
  statement_id  = "AllowAPIGatewayInvokeUPIDrafts"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.upi_drafts.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.upi.execution_arn}/*/*"
}

# ------------------------------------------------------------------------------
# 4. EventBridge Scheduler & Automation Worker Lambda
# ------------------------------------------------------------------------------
data "archive_file" "automation_worker_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../../lambda/automation_worker"
  output_path = "${path.module}/../../lambda/automation_worker.zip"
}

resource "aws_iam_role" "automation_lambda" {
  name = "finsight-automation-worker-role-${var.environment}"

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

resource "aws_cloudwatch_log_group" "automation" {
  name              = "/aws/lambda/finsight-automation-worker-${var.environment}"
  retention_in_days = 14

  tags = {
    Environment = var.environment
  }
}

resource "aws_iam_policy" "automation_policy" {
  name = "finsight-automation-worker-policy-${var.environment}"

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
        Resource = "${aws_cloudwatch_log_group.automation.arn}:*"
      },
      {
        Sid    = "SESSend"
        Effect = "Allow"
        Action = [
          "ses:SendEmail",
          "ses:SendTemplatedEmail",
          "ses:SendRawEmail"
        ]
        Resource = "*"
      },
      {
        Sid    = "SNSPublish"
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.events.arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "automation_attach" {
  role       = aws_iam_role.automation_lambda.name
  policy_arn = aws_iam_policy.automation_policy.arn
}

resource "aws_lambda_function" "automation" {
  function_name    = "finsight-automation-worker-${var.environment}"
  description      = "Executes scheduled financial summaries, settle-up reminders, and notifications"
  role             = aws_iam_role.automation_lambda.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  filename         = data.archive_file.automation_worker_zip.output_path
  source_code_hash = data.archive_file.automation_worker_zip.output_base64sha256
  timeout          = 60
  memory_size      = 256

  environment {
    variables = {
      ENVIRONMENT          = var.environment
      AWS_REGION           = var.aws_region
      MONGO_URI            = var.mongo_uri
      SNS_EVENTS_TOPIC_ARN = aws_sns_topic.events.arn
      SENDER_EMAIL         = var.sender_email
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.automation,
    aws_iam_role_policy_attachment.automation_attach
  ]

  tags = {
    Name        = "finsight-automation-worker-${var.environment}"
    Environment = var.environment
  }
}

# EventBridge Rules: Daily End-of-Day Prompt (21:00 IST / 15:30 UTC)
resource "aws_cloudwatch_event_rule" "end_of_day" {
  name                = "finsight-end-of-day-${var.environment}"
  description         = "Daily prompt to log unrecorded expenses"
  schedule_expression = "cron(30 15 * * ? *)"

  tags = {
    Environment = var.environment
  }
}

resource "aws_cloudwatch_event_target" "end_of_day" {
  rule      = aws_cloudwatch_event_rule.end_of_day.name
  target_id = "TriggerAutomationWorkerEndOfDay"
  arn       = aws_lambda_function.automation.arn
  input     = jsonencode({ type = "END_OF_DAY" })
}

resource "aws_lambda_permission" "eventbridge_end_of_day" {
  statement_id  = "AllowEventBridgeEndOfDay"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.automation.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.end_of_day.arn
}

# EventBridge Rules: Weekly Settle-Up Reminder (Sundays at 18:00 IST / 12:30 UTC)
resource "aws_cloudwatch_event_rule" "settle_up" {
  name                = "finsight-weekly-settleup-${var.environment}"
  description         = "Weekly settle-up reminder for active trips"
  schedule_expression = "cron(30 12 ? * SUN *)"

  tags = {
    Environment = var.environment
  }
}

resource "aws_cloudwatch_event_target" "settle_up" {
  rule      = aws_cloudwatch_event_rule.settle_up.name
  target_id = "TriggerAutomationWorkerSettleUp"
  arn       = aws_lambda_function.automation.arn
  input     = jsonencode({ type = "SETTLE_UP" })
}

resource "aws_lambda_permission" "eventbridge_settle_up" {
  statement_id  = "AllowEventBridgeSettleUp"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.automation.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.settle_up.arn
}

# EventBridge Rules: Monthly Spending Digest (1st of month at 09:00 IST / 03:30 UTC)
resource "aws_cloudwatch_event_rule" "monthly_summary" {
  name                = "finsight-monthly-digest-${var.environment}"
  description         = "Monthly expense digest and report"
  schedule_expression = "cron(30 3 1 * ? *)"

  tags = {
    Environment = var.environment
  }
}

resource "aws_cloudwatch_event_target" "monthly_summary" {
  rule      = aws_cloudwatch_event_rule.monthly_summary.name
  target_id = "TriggerAutomationWorkerMonthlySummary"
  arn       = aws_lambda_function.automation.arn
  input     = jsonencode({ type = "MONTHLY_SUMMARY" })
}

resource "aws_lambda_permission" "eventbridge_monthly_summary" {
  statement_id  = "AllowEventBridgeMonthlySummary"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.automation.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.monthly_summary.arn
}

# ------------------------------------------------------------------------------
# 5. Optional ElastiCache Redis Cluster (Controlled by enable_elasticache flag)
# ------------------------------------------------------------------------------
resource "aws_elasticache_subnet_group" "redis" {
  count      = var.enable_elasticache && length(var.private_subnet_ids) > 0 ? 1 : 0
  name       = "finsight-redis-subnets-${var.environment}"
  subnet_ids = var.private_subnet_ids

  tags = {
    Environment = var.environment
  }
}

resource "aws_security_group" "redis" {
  count       = var.enable_elasticache && var.vpc_id != "" ? 1 : 0
  name        = "finsight-redis-sg-${var.environment}"
  description = "Allows Redis traffic from ECS tasks on port 6379"
  vpc_id      = var.vpc_id

  ingress {
    description     = "Redis port 6379 from ECS tasks"
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = var.ecs_tasks_security_group_id != "" ? [var.ecs_tasks_security_group_id] : []
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "finsight-redis-sg-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_elasticache_cluster" "redis" {
  count                = var.enable_elasticache ? 1 : 0
  cluster_id           = "finsight-redis-${var.environment}"
  engine               = "redis"
  node_type            = "cache.t4g.micro" # Lowest cost Redis node (~$11.70/mo)
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
  subnet_group_name    = aws_elasticache_subnet_group.redis[0].name
  security_group_ids   = [aws_security_group.redis[0].id]

  tags = {
    Name        = "finsight-redis-${var.environment}"
    Environment = var.environment
  }
}
