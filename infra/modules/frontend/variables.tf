variable "environment" {
  description = "Environment name (dev, prod)"
  type        = string
}

variable "alb_dns_name" {
  description = "DNS name of the Application Load Balancer for the /api/* CloudFront origin"
  type        = string
}

variable "custom_domain_name" {
  description = "Optional custom domain name (e.g. finsight.example.com). Leave empty for CloudFront default domain."
  type        = string
  default     = ""
}

variable "certificate_arn" {
  description = "Optional ACM certificate ARN in us-east-1 (required by CloudFront if custom_domain_name is used)"
  type        = string
  default     = ""
}
