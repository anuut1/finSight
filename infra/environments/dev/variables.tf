variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "Primary AWS region"
  type        = string
  default     = "ap-south-1"
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "github_repo" {
  description = "GitHub repository for CodePipeline source"
  type        = string
  default     = "anuut1/finSight"
}

variable "github_branch" {
  description = "GitHub branch for deployment trigger"
  type        = string
  default     = "master"
}

variable "codestar_connection_arn" {
  description = "CodeStar Connection ARN for GitHub"
  type        = string
  default     = ""
}

variable "container_port" {
  description = "Port exposed by the Node container"
  type        = number
  default     = 5000
}

variable "fargate_cpu" {
  description = "Fargate CPU units (256 = 0.25 vCPU for lowest cost)"
  type        = string
  default     = "256"
}

variable "fargate_memory" {
  description = "Fargate memory units (512 = 512 MB for lowest cost)"
  type        = string
  default     = "512"
}

variable "desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 1
}

variable "custom_domain_name" {
  description = "Custom domain name (optional for dev)"
  type        = string
  default     = ""
}

variable "certificate_arn" {
  description = "ACM certificate ARN for HTTPS (optional for dev)"
  type        = string
  default     = ""
}

variable "alert_email" {
  description = "Email address for SNS alarms and AWS budget notifications"
  type        = string
  default     = ""
}

variable "budget_limit_amount" {
  description = "Monthly AWS budget limit in USD"
  type        = string
  default     = "10"
}

variable "rate_limit_per_ip" {
  description = "WAF rate limit per IP per 5 minutes"
  type        = number
  default     = 500
}

variable "enable_elasticache" {
  description = "Provision ElastiCache Redis cluster (cost ~$11.70/mo per cache.t4g.micro node)"
  type        = bool
  default     = false
}
