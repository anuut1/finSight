# ==============================================================================
# ECR Module - Encrypted, Image Scanning on Push, Cost-Optimized Lifecycle
# ==============================================================================

resource "aws_ecr_repository" "api" {
  name                 = "${var.repository_name}-${var.environment}"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Name        = "${var.repository_name}-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_ecr_lifecycle_policy" "api" {
  repository = aws_ecr_repository.api.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Expire untagged images older than 7 days"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 7
        }
        action = {
          type = "expire"
        }
      },
      {
        rulePriority = 2
        description  = "Keep only last 10 tagged deployment images"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["v", "sha-", "release-", "build-"]
          countType     = "imageCountMoreThan"
          countNumber   = 10
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}
