#!/usr/bin/env bash
set -euo pipefail

REGION="${1:?Usage: deploy-api.sh <aws-region> <ecr-repo-url> <cluster-name> <service-name>}"
ECR_REPO="${2:?Missing ECR repo URL}"
CLUSTER="${3:?Missing ECS cluster name}"
SERVICE="${4:?Missing ECS service name}"

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

echo "==> Forcing ECS deployment"
aws ecs update-service \
  --region "${REGION}" \
  --cluster "${CLUSTER}" \
  --service "${SERVICE}" \
  --force-new-deployment \
  --query "service.serviceName" \
  --output text

echo "==> Done. Image: ${ECR_REPO}:${IMAGE_TAG}"
