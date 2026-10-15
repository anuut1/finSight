variable "environment" {
  description = "Environment name (dev, prod)"
  type        = string
}

variable "alb_arn" {
  description = "Application Load Balancer ARN to associate with the Regional Web ACL"
  type        = string
}

variable "rate_limit_per_ip" {
  description = "Maximum number of requests allowed from a single IP per 5-minute evaluation window"
  type        = number
  default     = 500
}
