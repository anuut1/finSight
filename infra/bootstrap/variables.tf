variable "aws_region" {
  description = "Primary AWS region for FinSight resources"
  type        = string
  default     = "ap-south-1"
}

variable "github_repo" {
  description = "GitHub repository in format owner/repo (for OIDC trust)"
  type        = string
  default     = "anuut1/finSight"
}

variable "monthly_budget_usd" {
  description = "Monthly budget limit in USD for AWS Budgets alert"
  type        = number
  default     = 25
}

variable "alert_email" {
  description = "Email address to receive AWS Budget threshold notifications"
  type        = string
  default     = ""
}

variable "create_oidc_provider" {
  description = "Whether to create the GitHub Actions OIDC identity provider (set to false if already created in AWS account)"
  type        = bool
  default     = true
}

variable "existing_oidc_provider_arn" {
  description = "ARN of existing GitHub Actions OIDC provider if create_oidc_provider is false"
  type        = string
  default     = ""
}
