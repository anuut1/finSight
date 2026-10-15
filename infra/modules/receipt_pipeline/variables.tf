variable "environment" {
  description = "Environment name (dev, prod)"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-south-1"
}

variable "kms_key_arn" {
  description = "KMS Customer Managed Key ARN for S3 bucket encryption"
  type        = string
}

variable "sns_alerts_topic_arn" {
  description = "SNS topic ARN for DLQ alarms"
  type        = string
}

variable "allowed_origins" {
  description = "Allowed origins for S3 bucket CORS"
  type        = list(string)
  default     = ["*"]
}

variable "mongo_uri" {
  description = "MongoDB connection string for Lambda scanner"
  type        = string
  default     = ""
  sensitive   = true
}

variable "retention_days" {
  description = "Number of days before receipt images expire in S3"
  type        = number
  default     = 14
}
