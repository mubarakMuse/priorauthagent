# Prior Auth — AWS infrastructure (Terraform)

Production-oriented AWS layout:

```
Internet
   │
   ▼
CloudFront  ── /api/* ──►  ALB  ──►  ECS Fargate (FastAPI)
   │
   └── /* ──►  S3 (React static build)
```

| Component | AWS service |
|-----------|-------------|
| API | ECS Fargate + ECR |
| Load balancer | Application Load Balancer (120s idle timeout) |
| Frontend | S3 + CloudFront (OAC, SPA routing) |
| Secrets | Secrets Manager (`ANTHROPIC_API_KEY`) |
| Network | VPC, public + private subnets, NAT gateway |
| Logs | CloudWatch Logs (30-day retention) |

## Prerequisites

- [Terraform](https://developer.hashicorp.com/terraform/install) >= 1.5
- [AWS CLI](https://aws.amazon.com/cli/) configured (`aws configure` or SSO)
- [Docker](https://docs.docker.com/get-docker/)
- Node.js 20+ (frontend build)

## 1. Configure variables

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars — set anthropic_api_key (or use TF_VAR_anthropic_api_key)
```

For remote state (recommended), see `backend.tf.example`.

## 2. Provision infrastructure

```bash
terraform init
terraform plan
terraform apply
```

First apply creates VPC, ECR, ECS, ALB, CloudFront, and Secrets Manager.  
The ECS service may fail health checks until you push a container image (step 3).

## 3. Deploy the API

```bash
# From repo root — use outputs from terraform apply
cd infra/terraform
terraform output -raw deploy_api_command | bash
```

Or manually:

```bash
chmod +x scripts/deploy-api.sh
./scripts/deploy-api.sh \
  us-east-1 \
  "$(terraform -chdir=infra/terraform output -raw ecr_repository_url)" \
  "$(terraform -chdir=infra/terraform output -raw ecs_cluster_name)" \
  "$(terraform -chdir=infra/terraform output -raw ecs_service_name)"
```

## 4. Deploy the frontend

```bash
chmod +x scripts/deploy-frontend.sh
./scripts/deploy-frontend.sh \
  "$(terraform -chdir=infra/terraform output -raw frontend_bucket_name)" \
  "$(terraform -chdir=infra/terraform output -raw cloudfront_distribution_id)"
```

## 5. Open the app

```bash
terraform -chdir=infra/terraform output cloudfront_url
```

The frontend calls `/api/process` on the same CloudFront domain — no CORS issues in production.

## Custom domain (optional)

1. Request an ACM certificate in **us-east-1** for your domain.
2. Set `domain_name` and `acm_certificate_arn` in `terraform.tfvars`.
3. Point Route 53 (or your DNS) CNAME to the CloudFront domain.
4. `terraform apply` and redeploy frontend.

## Local development

```bash
# API
export ANTHROPIC_API_KEY="..."
docker compose up --build
# or: uvicorn app:app --reload

# Frontend (proxies /api → localhost:8000)
cd frontend && npm run dev
```

## Cost notes

- NAT Gateway: ~$32/month if `enable_nat_gateway = true`. Set to `false` to run ECS tasks in public subnets (lower cost, less isolation).
- Fargate: scales with `api_desired_count`, CPU, and memory.
- CloudFront + S3: low at moderate traffic.

## Production hardening (next steps)

- Enable S3 + DynamoDB remote state (`backend.tf.example`)
- Add WAF on CloudFront
- Add Cognito auth in front of `/api/*`
- Move LLM pipeline to SQS + worker (async jobs)
- RDS PostgreSQL for case audit trail
- HIPAA: BAA, encrypt PHI at rest, strip clinical text from logs

## Destroy

```bash
cd infra/terraform
terraform destroy
```

Empty the frontend S3 bucket first if `force_destroy` is not set on the bucket.
