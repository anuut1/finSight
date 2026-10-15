output "upi_api_endpoint" {
  description = "HTTP API Gateway endpoint URL for UPI draft ingestion"
  value       = "${aws_apigatewayv2_api.upi.api_endpoint}/upi/drafts"
}

output "upi_drafts_lambda_arn" {
  description = "ARN of the UPI draft ingestion Lambda"
  value       = aws_lambda_function.upi_drafts.arn
}

output "automation_lambda_arn" {
  description = "ARN of the scheduled automation worker Lambda"
  value       = aws_lambda_function.automation.arn
}

output "events_sns_topic_arn" {
  description = "ARN of the SNS events topic"
  value       = aws_sns_topic.events.arn
}

output "redis_endpoint" {
  description = "Host endpoint of the ElastiCache Redis cluster (if enabled)"
  value       = var.enable_elasticache ? aws_elasticache_cluster.redis[0].cache_nodes[0].address : "disabled"
}
