output "aws_region" {
  description = "AWS region"
  value       = var.aws_region
}

output "state_bucket_name" {
  description = "Name of the S3 bucket storing Terraform remote state"
  value       = aws_s3_bucket.terraform_state.id
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB table for state locking"
  value       = aws_dynamodb_table.terraform_locks.name
}

output "github_oidc_role_arn" {
  description = "ARN of the IAM role to configure as AWS_DEPLOY_ROLE_ARN in GitHub Secrets"
  value       = aws_iam_role.github_actions.arn
}

output "backend_config_hcl" {
  description = "Paste this block into infra/backend.tf for remote state"
  value       = <<-EOT
terraform {
  backend "s3" {
    bucket         = "${aws_s3_bucket.terraform_state.id}"
    key            = "prod/terraform.tfstate"
    region         = "${var.aws_region}"
    dynamodb_table = "${aws_dynamodb_table.terraform_locks.name}"
    encrypt        = true
  }
}
EOT
}
