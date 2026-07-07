#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Arcflow — Architecture Diagram Generator  /  Destroy
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"
TF_DIR="$ROOT_DIR/terraform"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; BOLD='\033[1m'; NC='\033[0m'

log()  { echo -e "\n${BLUE}▶${NC} $*"; }
ok()   { echo -e "  ${GREEN}✓${NC} $*"; }
die()  { echo -e "\n${RED}✗ ERROR:${NC} $*\n" >&2; exit 1; }
hr()   { echo -e "\n${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; }

# ── Inputs ────────────────────────────────────────────────────────────────────
AWS_REGION="${AWS_REGION:-us-east-1}"
STUDENT_NAME="${STUDENT_NAME:-}"
CI_MODE="${CI:-false}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --name)   STUDENT_NAME="$2"; shift 2 ;;
    --region) AWS_REGION="$2";   shift 2 ;;
    *) die "Unknown argument: $1" ;;
  esac
done

if [ -z "$STUDENT_NAME" ]; then
  echo ""
  read -rp "  Enter the deployment name to destroy: " STUDENT_NAME
fi

hr
echo -e "  ${RED}${BOLD}WARNING: This will permanently delete all Arcflow resources${NC}"
echo    "  Name    : $STUDENT_NAME"
echo    "  Region  : $AWS_REGION"
hr

if [ "$CI_MODE" != "true" ]; then
  echo ""
  read -rp "  Type 'yes' to confirm destruction: " CONFIRM
  [[ "$CONFIRM" == "yes" ]] || { echo "Aborted."; exit 0; }
fi

# ── Empty S3 bucket ───────────────────────────────────────────────────────────
log "Initialising Terraform..."
terraform -chdir="$TF_DIR" init -input=false -no-color \
  2>&1 | grep -E "^(Terraform|Error|Warning|Initializing)" || true

log "Emptying S3 bucket..."
BUCKET=$(terraform -chdir="$TF_DIR" output -raw frontend_bucket 2>/dev/null || echo "")
if [ -n "$BUCKET" ]; then
  aws s3 rm "s3://$BUCKET" --recursive --region "$AWS_REGION" || true
  ok "Bucket emptied: $BUCKET"
else
  echo "  No bucket found in state — skipping."
fi

# ── Destroy infrastructure ────────────────────────────────────────────────────
log "Destroying AWS infrastructure..."
terraform -chdir="$TF_DIR" destroy \
  -auto-approve -input=false \
  -var "student_name=$STUDENT_NAME" \
  -var "aws_region=$AWS_REGION"
ok "All resources destroyed"

# ── Cleanup local artifacts ───────────────────────────────────────────────────
log "Cleaning up local artifacts..."
rm -rf "$FRONTEND_DIR/out/" "$FRONTEND_DIR/.next/"
ok "Local cleanup done"

hr
echo -e "  ${GREEN}${BOLD}✓  Destroy complete${NC}"
hr
