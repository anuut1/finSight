output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = module.alb.alb_dns_name
}

output "cloudfront_domain_name" {
  description = "Domain name of the CloudFront distribution for the React SPA"
  value       = module.frontend.cloudfront_domain_name
}

output "ecr_repository_url" {
  description = "URL of the ECR repository"
  value       = module.ecr.repository_url
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = module.ecs.cluster_name
}

output "ecs_service_name" {
  description = "Name of the ECS service"
  value       = module.ecs.service_name
}

output "codepipeline_id" {
  description = "ID of the CI/CD CodePipeline"
  value       = module.cicd.pipeline_id
}

output "kms_key_arn" {
  description = "ARN of the KMS customer managed key"
  value       = module.kms.key_arn
}

output "waf_web_acl_arn" {
  description = "ARN of the WAFv2 Web ACL protecting the API"
  value       = module.waf.web_acl_arn
}

output "cloudwatch_dashboard_name" {
  description = "Name of the operational CloudWatch dashboard"
  value       = module.monitoring.dashboard_name
}

output "sns_alerts_topic_arn" {
  description = "ARN of the SNS topic for alarms and budget alerts"
  value       = module.monitoring.sns_topic_arn
}

output "cloudtrail_s3_bucket" {
  description = "Name of the S3 audit bucket storing CloudTrail management events"
  value       = module.cloudtrail.bucket_name
}

output "receipts_bucket_name" {
  description = "Name of the private S3 receipts bucket"
  value       = module.receipt_pipeline.receipts_bucket_name
}

output "receipt_sqs_queue_url" {
  description = "URL of the receipt processing SQS queue"
  value       = module.receipt_pipeline.sqs_queue_url
}

output "receipt_dlq_arn" {
  description = "ARN of the receipt processing dead letter queue"
  value       = module.receipt_pipeline.dlq_arn
}

output "receipt_lambda_arn" {
  description = "ARN of the receipt scanner Lambda function"
  value       = module.receipt_pipeline.lambda_arn
}

output "upi_api_endpoint" {
  description = "HTTP API Gateway endpoint URL for external UPI draft ingestion"
  value       = module.automation.upi_api_endpoint
}

output "events_sns_topic_arn" {
  description = "ARN of the SNS topic for event fan-out"
  value       = module.automation.events_sns_topic_arn
}

output "redis_endpoint" {
  description = "Endpoint of the ElastiCache Redis cluster (if enabled)"
  value       = module.automation.redis_endpoint
}
