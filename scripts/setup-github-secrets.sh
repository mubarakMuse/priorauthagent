#!/usr/bin/env bash
set -euo pipefail

REPO="${1:-mubarakMuse/priorauthagent}"
TF_DIR="$(cd "$(dirname "$0")/../infra/terraform" && pwd)"

if ! command -v gh >/dev/null 2>&1; then
  echo "Install GitHub CLI: brew install gh"
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "Log in to GitHub first:"
  echo "  gh auth login"
  exit 1
fi

cd "$TF_DIR"
ACCESS_KEY_ID=$(terraform output -raw github_actions_access_key_id)
SECRET_ACCESS_KEY=$(terraform output -raw github_actions_secret_access_key)

echo "Setting repository secrets on ${REPO}..."
printf '%s' "$ACCESS_KEY_ID" | gh secret set AWS_ACCESS_KEY_ID --repo "$REPO"
printf '%s' "$SECRET_ACCESS_KEY" | gh secret set AWS_SECRET_ACCESS_KEY --repo "$REPO"

echo "Done. Secrets configured:"
gh secret list --repo "$REPO" | grep AWS_
