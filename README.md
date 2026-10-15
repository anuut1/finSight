# FinSight - Cloud-Native AWS Infrastructure & Architecture

FinSight is a production-grade, secure, cost-optimized MERN web application for group expense splitting, financial dashboards, AI-assisted receipt itemization, and trip-mode UPI payment drafting.

This repository contains the complete Infrastructure as Code (IaC) written in modular Terraform, production-hardened multi-stage Docker containerization, zero-NAT cost-saving networking, and event-driven serverless pipelines.

---

## 1. System Architecture

```mermaid
flowchart TD
    subgraph Client["Users & Mobile Browsers"]
        User["End User / Mobile"]
    end

    subgraph Edge["Global Edge Layer"]
        CF["CloudFront CDN (TLS 1.3 / OAC)"]
        WAF["AWS WAFv2 (Rate Limiting & OWASP Top 10)"]
    end

    subgraph FrontendHosting["Frontend Static Hosting"]
        S3Front["Private S3 Bucket (Vite React 19 SPA)"]
    end

    subgraph VPC["Amazon VPC (ap-south-1 Mumbai / Multi-AZ)"]
        direction TB
        subgraph PublicSubnets["Public Subnets (2 AZs)"]
            ALB["Application Load Balancer (Health: /api/health)"]
        end

        subgraph PrivateSubnets["Private Subnets (Zero NAT Gateway)"]
            ECS["ECS Fargate Tasks (Node 20 / Non-root)"]
            VPCE["VPC Endpoints (S3, ECR, Logs, SSM, Secrets)"]
        end
    end

    subgraph Data["Data & Secrets"]
        Atlas[("MongoDB Atlas (TLS Encrypted)")]
        SSM["AWS SSM Parameter Store (SecureString)"]
        KMS["AWS KMS Customer Managed Key (CMK)"]
    end

    subgraph ReceiptPipeline["Asynchronous Receipt Scanning"]
        S3Receipts["Private S3 Receipts Bucket (14d Expiry)"]
        SQS["Amazon SQS Queue (Visibility: 180s)"]
        DLQ["Dead Letter Queue (Retention: 14d)"]
        LambdaOCR["Lambda Receipt Scanner (Node 20)"]
        Textract["Amazon Textract (AnalyzeExpense)"]
    end

    subgraph Automation["Smart Automation & Messaging"]
        APIGW["HTTP API Gateway (/upi/drafts)"]
        LambdaUPI["Lambda UPI Ingestion"]
        Bedrock["Amazon Bedrock (Titan Express AI)"]
        EventBridge["EventBridge Scheduler (Daily / Weekly / Monthly)"]
        LambdaWorker["Lambda Scheduled Worker"]
        SES["Amazon SES (Email Templates)"]
        SNS["Amazon SNS (Event Fan-out & Alerts)"]
    end

    subgraph Observability["Monitoring & Security"]
        CW["CloudWatch Dashboard & 14-day Log Groups"]
        Alarms["CloudWatch Metric Alarms (ALB 5xx, CPU, DLQ)"]
        Trail["CloudTrail Management Audit Trail (S3)"]
        Budget["AWS Monthly Budget ($10 Threshold)"]
    end

    %% Flows
    User -->|HTTPS| CF
    CF -->|Static Assets /*| S3Front
    CF -->|Reverse Proxy /api/*| ALB
    WAF --- ALB
    ALB -->|Target Port 5000| ECS
    ECS -->|Internal Endpoints| VPCE
    ECS -->|Mongoose TLS| Atlas
    ECS -.->|Read Secrets at Boot| SSM
    SSM -.->|KMS Decrypt| KMS

    %% Receipt Pipeline
    User -->|Direct Presigned PUT| S3Receipts
    S3Receipts -->|ObjectCreated Event| SQS
    SQS -->|Consume Batch=1| LambdaOCR
    SQS -.->|Errors > 3| DLQ
    LambdaOCR -->|AnalyzeExpense| Textract
    LambdaOCR -->|Store Line Items| Atlas

    %% UPI Ingestion & Automation
    User -.->|Webhook / SMS Draft| APIGW
    APIGW --> LambdaUPI
    LambdaUPI -->|Clean Merchant & Categorize| Bedrock
    LambdaUPI -->|Save Draft| Atlas

    EventBridge -->|Cron Triggers| LambdaWorker
    LambdaWorker -->|Send Emails| SES
    LambdaWorker -->|Publish Events| SNS

    %% Alarms & Observability
    ECS -->|awslogs| CW
    LambdaOCR -->|awslogs| CW
    Alarms -->|Notify| SNS
    Budget -->|Notify| SNS
```

---

## 2. Infrastructure Highlights & Security

* **Zero NAT Gateway Overhead:** ECS tasks execute inside private subnets without public IPs and communicate with AWS services (ECR, CloudWatch Logs, SSM, Secrets Manager, S3) exclusively over **AWS VPC Endpoints**. This reduces baseline network costs by ~$32/month per environment.
* **Unified Domain Reverse Proxy:** Amazon CloudFront acts as a single origin for both static React SPA assets (via S3 Origin Access Control) and dynamic `/api/*` requests (proxied to the ALB). This eliminates cross-origin cookie issues and eliminates CORS complexity.
* **Zero Hardcoded Secrets:** Application secrets (`MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`) are stored in AWS SSM Parameter Store as `SecureString` encrypted with a dedicated AWS KMS Customer Managed Key (CMK), with `ignore_changes = [value]` so production rotations are preserved.
* **Least Privilege IAM:** Dedicated execution and task roles for ECS and Lambdas. No IAM users or access keys are used in application runtime.
* **Automated Security Gate in CI/CD:** CodeBuild automatically scans the newly built ECR image and halts deployment if any `CRITICAL` CVE vulnerabilities are found.
* **Multi-Layer Defense:**
  * WAFv2 on the ALB: Rate limiting (500 req/5 min) and AWS Managed Common Rules.
  * Express API: `helmet` security headers, strict CORS validation, and 1MB request body limits.
  * S3: Public access blocked on all buckets, SSE-KMS encryption, TLS-only bucket policies, and 14-day lifecycle expiration on receipts.

---

## 3. How to Deploy

### Prerequisites
* [Terraform >= 1.5](https://www.terraform.io/)
* [AWS CLI v2](https://aws.amazon.com/cli/) configured with administrator credentials:
  ```powershell
  aws sts get-caller-identity
  ```
* Node.js 20+ and npm

### Step 1: Deploy Remote State Backend (One-time bootstrap)
```powershell
terraform -chdir="infra/bootstrap" init
terraform -chdir="infra/bootstrap" plan
terraform -chdir="infra/bootstrap" apply
```

### Step 2: Configure Environment Variables
Copy the example variables file for the target environment:
```powershell
# For Dev
cp infra/environments/dev/terraform.tfvars.example infra/environments/dev/terraform.tfvars

# For Prod
cp infra/environments/prod/terraform.tfvars.example infra/environments/prod/terraform.tfvars
```

Update `infra/environments/dev/terraform.tfvars` with:
```hcl
environment             = "dev"
aws_region              = "ap-south-1"
github_repo             = "anuut1/finSight"
github_branch           = "master"
codestar_connection_arn = "arn:aws:codestar-connections:ap-south-1:ACCOUNT_ID:connection/YOUR-ID"
alert_email             = "your-email@example.com"
```

### Step 3: Initialize, Plan, and Deploy Infrastructure
```powershell
# Initialize providers and modules
terraform -chdir="infra/environments/dev" init

# Verify syntax
terraform -chdir="infra/environments/dev" validate

# Review execution plan
terraform -chdir="infra/environments/dev" plan

# When ready to create real AWS resources:
# terraform -chdir="infra/environments/dev" apply
```

### Step 4: Populate Sensitive Secrets (Post-Deploy)
Set production secrets directly in AWS SSM Parameter Store:
```powershell
aws ssm put-parameter --name "/finsight/dev/mongo_uri" --value "mongodb+srv://user:pass@cluster.mongodb.net/finsight" --type "SecureString" --overwrite --region ap-south-1
aws ssm put-parameter --name "/finsight/dev/jwt_secret" --value "your-production-jwt-secret-min-32-chars" --type "SecureString" --overwrite --region ap-south-1
```

---

## 4. How to Read Logs & Observability

### CloudWatch Log Groups
| Component | Log Group Name | Retention |
| :--- | :--- | :--- |
| **API Container (ECS)** | `/ecs/finsight-api-dev` | 14 days |
| **CI/CD Build** | `/codebuild/finsight-dev` | 14 days |
| **Receipt Scanner Lambda** | `/aws/lambda/finsight-receipt-scanner-dev` | 14 days |
| **UPI Drafts Lambda** | `/aws/lambda/finsight-upi-drafts-dev` | 14 days |
| **Scheduled Worker Lambda** | `/aws/lambda/finsight-automation-worker-dev` | 14 days |

### CloudWatch Insights Queries

**Inspect API Traffic, Status Codes, and Latency:**
```sql
fields @timestamp, method, url, statusCode, durationMs, requestId
| filter type = "HTTP_REQUEST"
| sort @timestamp desc
| limit 50
```

**Track AWS Service Calls (Textract, Bedrock, S3):**
```sql
fields @timestamp, service, operation, durationMs, success, error
| filter type = "AWS_CALL"
| sort @timestamp desc
| limit 50
```

**Find Unhandled Backend Errors:**
```sql
fields @timestamp, @message
| filter @message like /error|fail|exception/i
| sort @timestamp desc
| limit 25
```

### Operational Dashboard
* CloudWatch Dashboard: `finsight-dashboard-dev` (or `finsight-dashboard-prod`)
* Tracks 4 real-time metric panels:
  1. *API Status Codes* (2XX, 4XX, 5XX, ELB 5XX)
  2. *p95 & Average Latency* (TargetResponseTime)
  3. *ECS Fargate CPU & Memory Utilization* (%)
  4. *Target Host Health* (Healthy vs UnHealthy container instances)

---

## 5. How to Roll Back

### 1. Rolling Back ECS API Container
If a newly pushed container image causes errors, roll back ECS Fargate instantly to the previous task definition:
```powershell
# Find previous revision number
aws ecs list-task-definitions --family-prefix finsight-api-dev --sort DESC --region ap-south-1

# Force deployment of previous stable revision (e.g. revision 4)
aws ecs update-service `
  --cluster finsight-cluster-dev `
  --service finsight-service-dev `
  --task-definition finsight-api-dev:4 `
  --force-new-deployment `
  --region ap-south-1
```

### 2. Rolling Back Frontend Static Assets
If a frontend release introduces UI regressions:
```powershell
# Restore previous static dist from local backup or git checkout
git checkout <previous-commit-hash> -- finSight/client
npm --prefix finSight/client run build
aws s3 sync finSight/client/dist/ s3://<frontend-bucket-name>/ --delete

# Invalidate CloudFront edge cache
aws cloudfront create-invalidation --distribution-id <distribution-id> --paths "/*"
```

### 3. Rolling Back Infrastructure Changes (Terraform)
```powershell
# Checkout previous infrastructure commit
git checkout <previous-commit> -- infra/

# Review rollback plan
terraform -chdir="infra/environments/dev" plan

# Apply rollback safely
# terraform -chdir="infra/environments/dev" apply
```

---

## 6. Estimated Monthly Cost Breakdown

| Service | Dev Configuration | Prod Configuration | Estimated Dev Cost |
| :--- | :--- | :--- | :--- |
| **ECS Fargate** | 1 task (0.25 vCPU, 512 MB) | 2 tasks (HA multi-AZ) | ~$7.20 / mo |
| **Application Load Balancer** | 1 ALB (ap-south-1) | 1 ALB (ap-south-1) | ~$16.20 / mo |
| **VPC Interface Endpoints** | ECR, Logs, SSM, Secrets (Zero NAT) | Same | ~$10.00 / mo |
| **AWS WAFv2** | 1 Regional Web ACL + 3 rules | Same | ~$5.60 / mo |
| **AWS KMS** | 1 CMK (automated rotation) | Same | ~$1.00 / mo |
| **CloudWatch & Alarms** | 1 dashboard + 4 metric alarms | Same | ~$3.40 / mo |
| **S3 Buckets** | Frontend, receipts, audit (14d expiry) | Same | ~$0.60 / mo |
| **CloudFront CDN** | Free tier eligible (PriceClass_100) | Same | ~$0.50 / mo |
| **AWS Textract & Bedrock** | ~500 receipt scans & ~1,000 cleanings | Same | ~$5.50 / mo |
| **Serverless Lambdas & SQS** | Free tier (under 1M invocations) | Same | **$0.00** |
| **ElastiCache Redis** | *Optional (`enable_elasticache=false`)* | *Optional* | **$0.00** *(+$11.70 if enabled)* |
| **Total Estimated Monthly Spend** | | | **~$50.00 / mo** |

*(Compare with ~$115+/month for standard AWS setups utilizing NAT Gateways, multi-AZ Redis, and large instances).*

---

## 7. Clean Teardown Guide (`terraform destroy`)

To tear down all resources after testing or client demos with zero lingering costs:

```powershell
# 1. Empty S3 Buckets (AWS requires S3 buckets to be empty before deletion)
# Frontend bucket:
aws s3 rm s3://$(terraform -chdir="infra/environments/dev" output -raw cloudfront_domain_name) --recursive 2>$null || true
# Receipts bucket:
aws s3 rm s3://$(terraform -chdir="infra/environments/dev" output -raw receipts_bucket_name) --recursive 2>$null || true
# CloudTrail audit bucket:
aws s3 rm s3://$(terraform -chdir="infra/environments/dev" output -raw cloudtrail_s3_bucket) --recursive 2>$null || true

# 2. Run Terraform Destroy Plan
terraform -chdir="infra/environments/dev" plan -destroy

# 3. Destroy All AWS Resources (Prompted for confirmation)
terraform -chdir="infra/environments/dev" destroy

# 4. (Optional) Teardown Remote State Bootstrap (Only if decommissioning AWS account)
# terraform -chdir="infra/bootstrap" destroy
```
