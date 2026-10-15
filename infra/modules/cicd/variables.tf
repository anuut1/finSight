variable "environment" {
  description = "Environment name (dev, prod)"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-south-1"
}

variable "github_repo" {
  description = "GitHub repository name in format owner/repo"
  type        = string
  default     = "anuut1/finSight"
}

variable "github_branch" {
  description = "Branch that triggers the pipeline"
  type        = string
  default     = "master"
}

variable "codestar_connection_arn" {
  description = "ARN of the AWS CodeStar connection to GitHub. If empty, a placeholder is used until user authenticates."
  type        = string
  default     = ""
}

variable "ecr_repository_url" {
  description = "URL of the ECR repository"
  type        = string
}

variable "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  type        = string
}

variable "ecs_service_name" {
  description = "Name of the ECS Fargate service"
  type        = string
}

variable "frontend_bucket_id" {
  description = "Name of the S3 bucket storing frontend static build"
  type        = string
}

variable "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution to invalidate"
  type        = string
}
