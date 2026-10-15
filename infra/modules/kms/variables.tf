variable "environment" {
  description = "Environment name (dev, prod)"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-south-1"
}

variable "deletion_window_in_days" {
  description = "Duration in days after which the key is deleted"
  type        = number
  default     = 30
}
