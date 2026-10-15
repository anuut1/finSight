variable "environment" {
  description = "Environment name (dev, prod)"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-south-1"
}

variable "vpc_id" {
  description = "VPC ID where tasks run"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs where Fargate tasks are scheduled"
  type        = list(string)
}

variable "ecs_tasks_security_group_id" {
  description = "Security group ID for ECS tasks"
  type        = string
}

variable "target_group_arn" {
  description = "ALB target group ARN for routing traffic to tasks"
  type        = string
}

variable "image_url" {
  description = "Docker image repository URL and tag"
  type        = string
}

variable "container_port" {
  description = "Port the API container listens on"
  type        = number
  default     = 5000
}

variable "desired_count" {
  description = "Number of ECS tasks to run (1 for dev, 2 for prod)"
  type        = number
  default     = 1
}

variable "cpu" {
  description = "Fargate vCPU units (256 = 0.25 vCPU, lowest cost)"
  type        = string
  default     = "256"
}

variable "memory" {
  description = "Fargate memory in MB (512 = 0.5 GB, lowest cost)"
  type        = string
  default     = "512"
}

variable "environment_variables" {
  description = "Non-sensitive environment variables for the container"
  type = list(object({
    name  = string
    value = string
  }))
  default = []
}

variable "secrets" {
  description = "Sensitive parameters to inject from SSM Parameter Store or Secrets Manager"
  type = list(object({
    name      = string
    valueFrom = string
  }))
  default = []
}

variable "receipts_bucket_arn" {
  description = "ARN of the S3 receipts bucket for task role permission scoping"
  type        = string
  default     = ""
}
