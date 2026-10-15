# ==============================================================================
# FinSight - Prod Environment (Phase 1, 2 & 3: Receipt Scanning Pipeline)
# ==============================================================================

# 1. KMS Module (Customer Managed Key for SSM, S3, Logs, CloudTrail)
module "kms" {
  source      = "../../modules/kms"
  environment = var.environment
  aws_region  = var.aws_region
}

# 2. VPC Module (Multi-AZ, Cost-Saving VPC Endpoints, Zero NAT Gateway)
module "vpc" {
  source      = "../../modules/vpc"
  environment = var.environment
  aws_region  = var.aws_region
  vpc_cidr    = var.vpc_cidr
}

# 3. Security Groups Module
module "security_groups" {
  source         = "../../modules/security_groups"
  environment    = var.environment
  vpc_id         = module.vpc.vpc_id
  container_port = var.container_port
}

# 4. ECR Module
module "ecr" {
  source          = "../../modules/ecr"
  environment     = var.environment
  repository_name = "finsight-api"
}

# 5. ALB Module
module "alb" {
  source                = "../../modules/alb"
  environment           = var.environment
  vpc_id                = module.vpc.vpc_id
  public_subnet_ids     = module.vpc.public_subnet_ids
  alb_security_group_id = module.security_groups.alb_security_group_id
  container_port        = var.container_port
  health_check_path     = "/api/health"
  certificate_arn       = var.certificate_arn
}

# 6. Frontend Module (S3 + CloudFront with OAC & /api/* Reverse Proxy)
module "frontend" {
  source             = "../../modules/frontend"
  environment        = var.environment
  alb_dns_name       = module.alb.alb_dns_name
  custom_domain_name = var.custom_domain_name
  certificate_arn    = var.certificate_arn
}

# 7. Secrets Module (SSM Parameter Store with KMS Encryption, Injected to ECS)
module "secrets" {
  source      = "../../modules/secrets"
  environment = var.environment
  kms_key_arn = module.kms.key_arn
  client_url  = "https://${module.frontend.cloudfront_domain_name}"
}

# 8. Receipt Scanning Pipeline (S3 receipts bucket, SQS queue with DLQ, Textract, Lambda)
module "receipt_pipeline" {
  source               = "../../modules/receipt_pipeline"
  environment          = var.environment
  aws_region           = var.aws_region
  kms_key_arn          = module.kms.key_arn
  sns_alerts_topic_arn = module.monitoring.sns_topic_arn
  allowed_origins = [
    "https://${module.frontend.cloudfront_domain_name}"
  ]
}

# 9. ECS Fargate Module (High Availability across 2 AZs, 14-day logs, Injected Secrets)
module "ecs" {
  source                      = "../../modules/ecs"
  environment                 = var.environment
  aws_region                  = var.aws_region
  vpc_id                      = module.vpc.vpc_id
  private_subnet_ids          = module.vpc.private_subnet_ids
  ecs_tasks_security_group_id = module.security_groups.ecs_tasks_security_group_id
  target_group_arn            = module.alb.target_group_arn
  receipts_bucket_arn         = module.receipt_pipeline.receipts_bucket_arn
  image_url                   = "${module.ecr.repository_url}:latest"
  container_port              = var.container_port
  desired_count               = var.desired_count
  cpu                         = var.fargate_cpu
  memory                      = var.fargate_memory
  secrets                     = module.secrets.ecs_secrets

  environment_variables = [
    { name = "NODE_ENV", value = "production" },
    { name = "PORT", value = tostring(var.container_port) },
    { name = "AWS_REGION", value = var.aws_region },
    { name = "AWS_RECEIPTS_BUCKET", value = module.receipt_pipeline.receipts_bucket_name },
    { name = "LOG_LEVEL", value = "info" }
  ]
}

# 10. WAF Module (Regional WAFv2 on ALB with Rate Limiting & Common Rule Set)
module "waf" {
  source            = "../../modules/waf"
  environment       = var.environment
  alb_arn           = module.alb.alb_arn
  rate_limit_per_ip = var.rate_limit_per_ip
}

# 11. Monitoring & Observability Module (Dashboard, Alarms, SNS Topic, Budget)
module "monitoring" {
  source                  = "../../modules/monitoring"
  environment             = var.environment
  aws_region              = var.aws_region
  alert_email             = var.alert_email
  alb_arn_suffix          = module.alb.alb_arn_suffix
  target_group_arn_suffix = module.alb.target_group_arn_suffix
  ecs_cluster_name        = module.ecs.cluster_name
  ecs_service_name        = module.ecs.service_name
  budget_limit_amount     = var.budget_limit_amount
}

# 12. CloudTrail Module (Audit Logging to Encrypted, Locked-Down S3 Bucket)
module "cloudtrail" {
  source      = "../../modules/cloudtrail"
  environment = var.environment
}

# 13. CI/CD Module (CodePipeline, CodeBuild, S3 Artifacts)
module "cicd" {
  source                     = "../../modules/cicd"
  environment                = var.environment
  aws_region                 = var.aws_region
  github_repo                = var.github_repo
  github_branch              = var.github_branch
  codestar_connection_arn    = var.codestar_connection_arn
  ecr_repository_url         = module.ecr.repository_url
  ecs_cluster_name           = module.ecs.cluster_name
  ecs_service_name           = module.ecs.service_name
  frontend_bucket_id         = module.frontend.bucket_id
  cloudfront_distribution_id = module.frontend.cloudfront_distribution_id
}

# 14. Automation & Smart Features (Bedrock, EventBridge Scheduler, SES, SNS, UPI Ingestion)
module "automation" {
  source                      = "../../modules/automation"
  environment                 = var.environment
  aws_region                  = var.aws_region
  enable_elasticache          = var.enable_elasticache
  private_subnet_ids          = module.vpc.private_subnet_ids
  vpc_id                      = module.vpc.vpc_id
  ecs_tasks_security_group_id = module.security_groups.ecs_tasks_security_group_id
}
