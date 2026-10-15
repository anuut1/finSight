variable "environment" {
  description = "Environment name (dev, prod)"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-south-1"
}

variable "mongo_uri" {
  description = "MongoDB connection string for automation Lambdas"
  type        = string
  default     = ""
  sensitive   = true
}

variable "sender_email" {
  description = "Verified SES sender email address"
  type        = string
  default     = "notifications@finsight.app"
}

variable "bedrock_model_id" {
  description = "Amazon Bedrock model ID for text cleanup and categorization"
  type        = string
  default     = "amazon.titan-text-express-v1"
}

variable "enable_elasticache" {
  description = "Set to true to provision an AWS ElastiCache Redis cluster (estimated ~$11.70/mo per node)"
  type        = bool
  default     = false
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for optional ElastiCache Redis"
  type        = list(string)
  default     = []
}

variable "vpc_id" {
  description = "VPC ID for optional ElastiCache security group"
  type        = string
  default     = ""
}

variable "ecs_tasks_security_group_id" {
  description = "ECS tasks security group allowed to connect to Redis"
  type        = string
  default     = ""
}
