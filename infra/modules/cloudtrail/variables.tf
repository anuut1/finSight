variable "environment" {
  description = "Environment name (dev, prod)"
  type        = string
}

variable "retention_days" {
  description = "Number of days before audit logs expire from S3"
  type        = number
  default     = 90
}
