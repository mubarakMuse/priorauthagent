#!/usr/bin/env bash
set -euo pipefail

REGION="${1:?Usage: deploy-api.sh <aws-region> <ecr-repo-url> <cluster-name> <service-name>}"
ECR_REPO="${2:?Missing ECR repo URL}"
CLUSTER="${3:?Missing ECS cluster name}"
SERVICE="${4:?Missing ECS service name}"
WORKER_SERVICE="${5:-${CLUSTER%-cluster}-worker}"

IMAGE_TAG="${IMAGE_TAG:-$(git rev-parse --short HEAD 2>/dev/null || date +%Y%m%d%H%M%S)}"
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> Building API image for linux/amd64 (ECS Fargate): ${ECR_REPO}:${IMAGE_TAG}"
docker build --platform linux/amd64 -t "${ECR_REPO}:${IMAGE_TAG}" "${ROOT_DIR}"

echo "==> Logging in to ECR"
aws ecr get-login-password --region "${REGION}" \
  | docker login --username AWS --password-stdin "${ECR_REPO%%/*}"

echo "==> Pushing image"
docker push "${ECR_REPO}:${IMAGE_TAG}"

if [[ "${IMAGE_TAG}" != "latest" ]]; then
  docker tag "${ECR_REPO}:${IMAGE_TAG}" "${ECR_REPO}:latest"
  docker push "${ECR_REPO}:latest"
fi

echo "==> Forcing ECS API deployment"
aws ecs update-service \
  --region "${REGION}" \
  --cluster "${CLUSTER}" \
  --service "${SERVICE}" \
  --force-new-deployment \
  --query "service.serviceName" \
  --output text

echo "==> Forcing ECS worker deployment (${WORKER_SERVICE})"
if aws ecs describe-services \
  --region "${REGION}" \
  --cluster "${CLUSTER}" \
  --services "${WORKER_SERVICE}" \
  --query "services[0].status" \
  --output text 2>/dev/null | grep -q ACTIVE; then
  aws ecs update-service \
    --region "${REGION}" \
    --cluster "${CLUSTER}" \
    --service "${WORKER_SERVICE}" \
    --force-new-deployment \
    --query "service.serviceName" \
    --output text
else
  echo "    Worker service not found — skip (run terraform apply for jobs infra first)"
fi

echo "==> Done. Image: ${ECR_REPO}:${IMAGE_TAG}"
