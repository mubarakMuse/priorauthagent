#!/usr/bin/env bash
set -euo pipefail

BUCKET="${1:?Usage: deploy-frontend.sh <s3-bucket> <cloudfront-distribution-id>}"
DISTRIBUTION_ID="${2:?Missing CloudFront distribution ID}"

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND_DIR="${ROOT_DIR}/frontend"

echo "==> Installing frontend dependencies"
cd "${FRONTEND_DIR}"
npm ci

echo "==> Building frontend (same-origin /api via CloudFront)"
# VITE_API_BASE empty => requests go to /api/* on the same CloudFront domain
VITE_API_BASE="" npm run build

echo "==> Syncing to s3://${BUCKET}"
aws s3 sync dist/ "s3://${BUCKET}/" \
  --delete \
  --cache-control "public,max-age=31536000,immutable" \
  --exclude "index.html" \
  --exclude "*.html"

aws s3 sync dist/ "s3://${BUCKET}/" \
  --cache-control "public,max-age=0,must-revalidate" \
  --exclude "*" \
  --include "*.html"

echo "==> Invalidating CloudFront cache"
aws cloudfront create-invalidation \
  --distribution-id "${DISTRIBUTION_ID}" \
  --paths "/*" \
  --query "Invalidation.Id" \
  --output text

echo "==> Frontend deploy complete"
