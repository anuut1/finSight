# ==============================================================================
# Secrets Module - SSM Parameter Store with KMS Encryption
# ==============================================================================

resource "aws_ssm_parameter" "mongo_uri" {
  name        = "/finsight/${var.environment}/mongo_uri"
  description = "MongoDB Atlas connection string for FinSight ${var.environment}"
  type        = "SecureString"
  key_id      = var.kms_key_arn
  value       = var.initial_mongo_uri

  lifecycle {
    ignore_changes = [value]
  }

  tags = {
    Name        = "finsight-param-mongo-uri-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_ssm_parameter" "jwt_secret" {
  name        = "/finsight/${var.environment}/jwt_secret"
  description = "JWT Signing secret key for FinSight ${var.environment}"
  type        = "SecureString"
  key_id      = var.kms_key_arn
  value       = var.initial_jwt_secret

  lifecycle {
    ignore_changes = [value]
  }

  tags = {
    Name        = "finsight-param-jwt-secret-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_ssm_parameter" "client_url" {
  name        = "/finsight/${var.environment}/client_url"
  description = "Client frontend URL for CORS validation"
  type        = "String"
  value       = var.client_url != "" ? var.client_url : "https://finsight-${var.environment}.local"

  lifecycle {
    ignore_changes = [value]
  }

  tags = {
    Name        = "finsight-param-client-url-${var.environment}"
    Environment = var.environment
  }
}
