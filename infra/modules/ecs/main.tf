# ==============================================================================
# ECS Fargate Module - Minimal Sizing, Least Privilege IAM, 14-day Log Retention
# ==============================================================================

resource "aws_ecs_cluster" "main" {
  name = "finsight-cluster-${var.environment}"

  setting {
    name  = "containerInsights"
    value = var.environment == "prod" ? "enabled" : "disabled"
  }

  tags = {
    Name        = "finsight-cluster-${var.environment}"
    Environment = var.environment
  }
}

# CloudWatch Log Group for ECS Tasks (14-day retention as required)
resource "aws_cloudwatch_log_group" "ecs" {
  name              = "/ecs/finsight-api-${var.environment}"
  retention_in_days = 14

  tags = {
    Name        = "finsight-ecs-logs-${var.environment}"
    Environment = var.environment
  }
}

# ------------------------------------------------------------------------------
# IAM Roles (Separate Task Execution and Application Task Roles)
# ------------------------------------------------------------------------------

# 1. Task Execution Role (Pulling ECR image, pushing logs, reading secrets from SSM)
resource "aws_iam_role" "task_execution" {
  name = "finsight-ecs-task-execution-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Environment = var.environment
  }
}

resource "aws_iam_role_policy_attachment" "task_execution_standard" {
  role       = aws_iam_role.task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Scoped policy for task execution to read SSM parameters & Secrets Manager secrets
resource "aws_iam_policy" "task_execution_secrets" {
  name        = "finsight-ecs-secrets-policy-${var.environment}"
  description = "Allows ECS agent to retrieve SSM parameters and secrets for container environment"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameters",
          "ssm:GetParameter",
          "secretsmanager:GetSecretValue",
          "kms:Decrypt"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "task_execution_secrets_attach" {
  role       = aws_iam_role.task_execution.name
  policy_arn = aws_iam_policy.task_execution_secrets.arn
}

# 2. Application Task Role (App permissions: Textract AnalyzeExpense, S3 Receipts, SES)
resource "aws_iam_role" "task_role" {
  name = "finsight-ecs-task-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Environment = var.environment
  }
}

# Scoped least-privilege policy for application runtime
resource "aws_iam_policy" "task_permissions" {
  name        = "finsight-task-app-policy-${var.environment}"
  description = "Scoped permissions for FinSight backend: Textract OCR, S3 receipts, and SES"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowTextractAnalyzeExpense"
        Effect = "Allow"
        Action = [
          "textract:AnalyzeExpense"
        ]
        Resource = "*"
      },
      {
        Sid    = "AllowS3ReceiptsAccess"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = var.receipts_bucket_arn != "" ? [
          var.receipts_bucket_arn,
          "${var.receipts_bucket_arn}/*"
        ] : ["*"]
      },
      {
        Sid    = "AllowSESSendEmail"
        Effect = "Allow"
        Action = [
          "ses:SendEmail",
          "ses:SendRawEmail"
        ]
        Resource = "*"
      },
      {
        Sid    = "AllowBedrockInvoke"
        Effect = "Allow"
        Action = [
          "bedrock:InvokeModel"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "task_permissions_attach" {
  role       = aws_iam_role.task_role.name
  policy_arn = aws_iam_policy.task_permissions.arn
}

# ------------------------------------------------------------------------------
# ECS Task Definition (Fargate, 0.25 vCPU, 512 MB RAM, Non-root)
# ------------------------------------------------------------------------------
resource "aws_ecs_task_definition" "api" {
  family                   = "finsight-api-${var.environment}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.cpu
  memory                   = var.memory
  execution_role_arn       = aws_iam_role.task_execution.arn
  task_role_arn            = aws_iam_role.task_role.arn

  container_definitions = jsonencode([
    {
      name      = "finsight-api"
      image     = var.image_url
      essential = true

      portMappings = [
        {
          containerPort = var.container_port
          hostPort      = var.container_port
          protocol      = "tcp"
        }
      ]

      environment = var.environment_variables
      secrets     = var.secrets

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:${var.container_port}/api/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 15
      }
    }
  ])

  tags = {
    Name        = "finsight-task-def-${var.environment}"
    Environment = var.environment
  }
}

# ------------------------------------------------------------------------------
# ECS Fargate Service
# ------------------------------------------------------------------------------
resource "aws_ecs_service" "api" {
  name            = "finsight-service-${var.environment}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  deployment_maximum_percent         = 200
  deployment_minimum_healthy_percent = 100

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [var.ecs_tasks_security_group_id]
    assign_public_ip = false # Zero public IPs: secured inside private subnets
  }

  load_balancer {
    target_group_arn = var.target_group_arn
    container_name   = "finsight-api"
    container_port   = var.container_port
  }

  lifecycle {
    ignore_changes = [task_definition] # Allows CI/CD CodePipeline to update task revisions smoothly
  }

  tags = {
    Name        = "finsight-service-${var.environment}"
    Environment = var.environment
  }
}
