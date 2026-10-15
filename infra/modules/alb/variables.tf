variable "environment" {
  description = "Environment name (dev, prod)"
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs for the ALB"
  type        = list(string)
}

variable "alb_security_group_id" {
  description = "Security group ID for the ALB"
  type        = string
}

variable "container_port" {
  description = "Port the ECS container listens on"
  type        = number
  default     = 5000
}

variable "health_check_path" {
  description = "Health check path for the backend service"
  type        = string
  default     = "/api/health"
}

variable "certificate_arn" {
  description = "Optional ACM certificate ARN for HTTPS listener. If empty, port 80 forwards directly."
  type        = string
  default     = ""
}
