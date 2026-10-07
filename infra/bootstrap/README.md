# FinSight AWS Bootstrap

This one-time bootstrap provisions:
1. **S3 Bucket** (`finsight-tfstate-<account-id>-<region>`) for Terraform state with versioning, SSE-S3 encryption, and TLS enforcement.
2. **DynamoDB Table** (`finsight-terraform-locks`) for state locking.
3. **GitHub OIDC Provider & IAM Role** (`finsight-github-actions-role`) allowing GitHub Actions to authenticate securely without long-lived access keys.
4. **AWS Budgets** (`finsight-monthly-budget`) with automated email alerts at 50%, 80%, and 100% of the monthly target.

---

## How to Run the Bootstrap

1. Make sure your local AWS CLI is authenticated:
   ```powershell
   aws sts get-caller-identity
   ```
2. Copy `terraform.tfvars.example` to `terraform.tfvars` and set your `alert_email`:
   ```powershell
   cp terraform.tfvars.example terraform.tfvars
   ```
3. Initialize and apply:
   ```powershell
   cd infra/bootstrap
   terraform init
   terraform apply
   ```
4. Copy the generated `backend_config_hcl` snippet from outputs into `infra/backend.tf`.
5. Add the generated `github_oidc_role_arn` to your GitHub Repository Secrets as `AWS_DEPLOY_ROLE_ARN`.
