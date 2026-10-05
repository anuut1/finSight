# FinSight — Complete AWS Production Deployment Guide

This guide details how FinSight is deployed to **Amazon Web Services (AWS)** using cloud-native best practices, serverless container orchestration, and multi-origin content delivery.

---

## 1. High-Level AWS Architecture

```
[ User Browser / Mobile Client ]
              │
              ▼
   ┌─────────────────────────────────────────────────────────────┐
   │             Amazon CloudFront CDN (Global Edge)             │
   │                                                             │
   │   Path: /*                                Path: /api/*      │
   └───────┬───────────────────────────────────────┬─────────────┘
           │                                       │
           ▼ (Origin 1)                            ▼ (Origin 2 - No CORS needed)
   ┌───────────────────────┐             ┌───────────────────────────────────┐
   │ S3 Static Web Bucket  │             │         AWS App Runner            │
   │ - React 19 + Vite SPA │             │ - Node.js 20 Container (Docker)   │
   │ - CloudFront OAC      │             │ - Auto-scaling 1-5 instances      │
   │ - Private / Encrypted │             │ - Health check: /api/health       │
   └───────────────────────┘             └─────────────────┬─────────────────┘
                                                           │
                                                           ▼
                     ┌─────────────────────────────────────┴─────────────────────────────────────┐
                     │                                                                           │
                     ▼                                                                           ▼
           ┌───────────────────────┐                                                   ┌───────────────────────┐
           │   Amazon Textract     │                                                   │   Amazon SES          │
           │ - AnalyzeExpense API  │                                                   │ - Split-bill claims   │
           │ - Instant OCR receipt │                                                   │ - EOD expense digests │
           └─────────▲─────────────┘                                                   └───────────────────────┘
                     │
                     ▼
           ┌───────────────────────┐
           │ S3 Receipts Bucket    │
           │ - Pre-signed PUT URLs │
           │ - 30-day auto-delete  │
           │ - Server-Side SSE-S3  │
           └───────────────────────┘
                     │
                     ▼
           ┌───────────────────────┐
           │ MongoDB Atlas         │
           │ (or AWS DocumentDB)   │
           │ - Encrypted at rest   │
           │ - Network allowlist   │
           └───────────────────────┘
```

---

## 2. Key AWS Resources & Why They Were Chosen

| Resource | Service | Purpose & Justification |
| :--- | :--- | :--- |
| **Frontend CDN** | **Amazon CloudFront** | Low-latency global edge caching, SSL/TLS termination, and single domain routing (`/api/*` proxied to backend, eliminating CORS). |
| **Frontend Hosting** | **Amazon S3 (Private)** | Static website files served via **Origin Access Control (OAC)**. Public access is 100% blocked. |
| **Backend Container** | **AWS App Runner** | Fully managed container runtime. Automatically scales down to minimize cost and scales up on traffic spikes. Zero Kubernetes/ECS overhead. |
| **Container Registry**| **Amazon ECR** | Private Docker registry with automated vulnerability scanning on push and 5-image lifecycle retention. |
| **Receipt Storage** | **Amazon S3 (Private)** | Direct-to-S3 client uploads via **Pre-Signed URLs** (bypassing backend memory). Has a **30-day lifecycle auto-delete** rule to safeguard user privacy. |
| **OCR Processing** | **Amazon Textract** | `AnalyzeExpense` API extracts merchants, items, tax, and total amounts with fallback to regex heuristics. |
| **Transactional Email**| **Amazon SES** | High-deliverability transactional emails for itemized bill split requests and daily digest reminders. |
| **Security & IAM** | **AWS IAM Task Roles** | Zero hardcoded API keys in code. App Runner assumes dedicated IAM roles for Textract, S3, and SES. |

---

## 3. Fast Deployment: Option A (Automated Deployment Script)

### Prerequisites:
1. [AWS CLI](https://aws.amazon.com/cli/) installed and configured (`aws configure`).
2. [Docker Desktop](https://www.docker.com/) running.
3. Node.js 18+ installed.

### Run on Windows (PowerShell):
```powershell
cd "C:\Users\Anushree Tiwari\finSight\finSight\server\aws"
.\deploy.ps1 -AwsRegion "ap-south-1" -StackName "finsight-prod" -MongoUri "your-mongodb-connection-string" -JwtSecret "your-random-32-char-secret"
```

### Run on Linux / macOS (Bash):
```bash
cd finSight/server/aws
chmod +x deploy.sh
./deploy.sh ap-south-1 finsight-prod "your-mongodb-connection-string" "your-random-32-char-secret"
```

The script will automatically:
1. Deploy the CloudFormation stack (`cloudformation-full-stack.yaml`).
2. Log into Amazon ECR.
3. Build the backend Docker image and push it to ECR.
4. Build the client SPA (`npm run build`).
5. Sync the production build to the S3 frontend bucket.
6. Create an invalidation on CloudFront so users see the latest site instantly.
7. Print the public CloudFront HTTPS URL.

---

## 4. Option B: Automated GitHub Actions CI/CD Pipeline

The repository includes [`.github/workflows/deploy-aws.yml`](file:///.github/workflows/deploy-aws.yml).

### Setup in GitHub:
Go to your GitHub repository -> **Settings** -> **Secrets and variables** -> **Actions** -> **New repository secret**:

| Secret Name | Description | Example |
| :--- | :--- | :--- |
| `AWS_ROLE_TO_ASSUME` | IAM Role ARN configured for GitHub OIDC | `arn:aws:iam::123456789012:role/GitHubActionsDeployRole` |
| `AWS_REGION` | Your preferred AWS Region | `ap-south-1` or `us-east-1` |
| `AWS_FRONTEND_BUCKET` | S3 Frontend Bucket name from CloudFormation | `finsight-frontend-123456789012` |
| `AWS_ECR_REPOSITORY` | ECR repository name | `finsight-api` |
| `CLOUDFRONT_DISTRIBUTION_ID` | CloudFront Distribution ID | `E1A2B3C4D5E6F7` |

Whenever you push to the `master` or `main` branch, GitHub Actions will:
- Run all unit and integration tests.
- Build the Docker container and push to ECR.
- Deploy the frontend assets to S3 and invalidate CloudFront edge caches.

---

## 5. Security & Cost Optimization Summary

- **Cost Efficient**:
  - CloudFront: 1TB free data transfer per month (AWS Free Tier).
  - S3: Pennies per month for frontend and short-lived receipts.
  - S3 Lifecycle: Receipts are automatically purged after 30 days.
  - App Runner: Pauses / scales down when idle.
- **Security Best Practices**:
  - No public S3 buckets.
  - CloudFront OAC restricts S3 access strictly to CloudFront.
  - IAM least-privilege roles for container execution.
  - No hardcoded secrets anywhere in the codebase.
