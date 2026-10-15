output "receipts_bucket_name" {
  description = "Name of the private receipts S3 bucket"
  value       = aws_s3_bucket.receipts.bucket
}

output "receipts_bucket_arn" {
  description = "ARN of the private receipts S3 bucket"
  value       = aws_s3_bucket.receipts.arn
}

output "sqs_queue_url" {
  description = "URL of the primary receipt scanning SQS queue"
  value       = aws_sqs_queue.main.id
}

output "sqs_queue_arn" {
  description = "ARN of the primary receipt scanning SQS queue"
  value       = aws_sqs_queue.main.arn
}

output "dlq_arn" {
  description = "ARN of the receipt dead letter queue"
  value       = aws_sqs_queue.dlq.arn
}

output "lambda_arn" {
  description = "ARN of the receipt scanner Lambda function"
  value       = aws_lambda_function.scanner.arn
}

output "lambda_name" {
  description = "Name of the receipt scanner Lambda function"
  value       = aws_lambda_function.scanner.function_name
}
