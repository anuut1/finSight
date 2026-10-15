# ==============================================================================
# Security Groups Module - Strict Principle of Least Privilege
# ==============================================================================

# ALB Security Group
resource "aws_security_group" "alb" {
  name        = "finsight-alb-sg-${var.environment}"
  description = "Controls public inbound traffic to FinSight ALB"
  vpc_id      = var.vpc_id

  ingress {
    description = "HTTP from Internet (redirected to HTTPS)"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS from Internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description     = "Traffic to ECS Tasks on container port"
    from_port       = var.container_port
    to_port         = var.container_port
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
  }

  tags = {
    Name        = "finsight-alb-sg-${var.environment}"
    Environment = var.environment
  }
}

# ECS Tasks Security Group
resource "aws_security_group" "ecs_tasks" {
  name        = "finsight-ecs-tasks-sg-${var.environment}"
  description = "Allows inbound traffic only from the ALB to ECS Tasks"
  vpc_id      = var.vpc_id

  ingress {
    description = "Traffic from ALB only"
    from_port   = var.container_port
    to_port     = var.container_port
    protocol    = "tcp"
    # Self-referencing ALB SG rule is added below to avoid circular dependency
  }

  egress {
    description = "Outbound HTTPS to VPC Endpoints and MongoDB Atlas"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Outbound MongoDB standard port to MongoDB Atlas"
    from_port   = 27017
    to_port     = 27017
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "finsight-ecs-tasks-sg-${var.environment}"
    Environment = var.environment
  }
}

# Attach ingress rule from ALB to ECS tasks securely
resource "aws_security_group_rule" "ecs_from_alb" {
  type                     = "ingress"
  from_port                = var.container_port
  to_port                  = var.container_port
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.alb.id
  security_group_id        = aws_security_group.ecs_tasks.id
  description              = "Allow container port from ALB"
}
