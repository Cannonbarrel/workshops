#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Stash — URL Bookmark Saver  /  Destroy Script
# Empties the S3 frontend bucket, then runs terraform destroy
#
# Usage:
#   bash scripts/destroy.sh
#   bash scripts/destroy.sh --name john-smith
#   STUDENT_NAME=john-smith AWS_REGION=us-east-1 bash scripts/destroy.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
TF_DIR="$ROOT_DIR/terraform"
BACKEND_DIR="$ROOT_DIR/backend"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

log()  { echo -e "\n${BLUE}▶${NC} $*"; }
ok()   { echo -e "  ${GREEN}✓${NC} $*"; }
info() { echo -e "  ${CYAN}→${NC} $*"; }
warn() { echo -e "  ${YELLOW}!${NC} $*"; }
die()  { echo -e "\n${RED}✗ ERROR:${NC} $*\n" >&2; exit 1; }
hr()   { echo -e "\n${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; }

# ── Argument parsing ──────────────────────────────────────────
STUDENT_NAME="${STUDENT_NAME:-}"
AWS_REGION="${AWS_REGION:-us-east-1}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --name)   STUDENT_NAME="$2"; shift 2 ;;
    --region) AWS_REGION="$2";   shift 2 ;;
    *) die "Unknown argument: $1. Usage: bash destroy.sh --name <name>" ;;
  esac
done

if [ -z "$STUDENT_NAME" ]; then
  echo ""
  read -rp "  Enter your name/ID (same as used during deploy): " STUDENT_NAME
fi
[[ "$STUDENT_NAME" =~ ^[a-z0-9-]+$ ]] || die "Name must be lowercase letters, numbers, and hyphens only."

# ── Prerequisites ─────────────────────────────────────────────
command -v aws       &>/dev/null || die "aws CLI not found"
command -v terraform &>/dev/null || die "terraform not found"
aws sts get-caller-identity &>/dev/null || die "AWS credentials not configured"

# ── Safety confirmation ───────────────────────────────────────
hr
echo -e "  ${RED}${BOLD}Stash — Destroy${NC}"
echo    "  Name    : $STUDENT_NAME"
echo    "  Region  : $AWS_REGION"
hr
echo ""
echo -e "  ${YELLOW}${BOLD}WARNING:${NC} This will permanently destroy:"
echo    "  • Lambda function"
echo    "  • API Gateway"
echo    "  • DynamoDB table (ALL bookmark data will be lost)"
echo    "  • S3 bucket (frontend)"
echo    "  • CloudWatch log groups and dashboard"
echo ""
read -rp "  Type 'yes' to confirm destruction: " CONFIRM
[[ "$CONFIRM" == "yes" ]] || { echo "  Aborted. Nothing was changed."; exit 0; }

# ── Init Terraform if needed ──────────────────────────────────
if [ ! -d "$TF_DIR/.terraform" ]; then
  log "Initialising Terraform..."
  terraform -chdir="$TF_DIR" init -upgrade -input=false -no-color \
    2>&1 | grep -E "^(Terraform|Error|Warning|Initializing)" || true
  ok "Terraform ready"
fi

# ── Get bucket name from Terraform state ─────────────────────
log "Reading existing infrastructure state..."
BUCKET=$(terraform -chdir="$TF_DIR" output -raw frontend_bucket 2>/dev/null || echo "")
FN=$(terraform -chdir="$TF_DIR" output -raw function_name 2>/dev/null || echo "")
TABLE=$(terraform -chdir="$TF_DIR" output -raw table_name 2>/dev/null || echo "")

if [ -z "$BUCKET" ]; then
  warn "Could not read Terraform outputs — infrastructure may not be deployed."
  read -rp "  Continue with destroy anyway? [y/N] " yn
  [[ "$yn" =~ ^[Yy]$ ]] || { echo "  Aborted."; exit 0; }
else
  info "Lambda    : $FN"
  info "DynamoDB  : $TABLE"
  info "S3 bucket : $BUCKET"
fi

# ── Empty S3 bucket (required before terraform destroy) ───────
if [ -n "$BUCKET" ]; then
  log "Emptying S3 bucket: $BUCKET ..."
  OBJECT_COUNT=$(aws s3 ls "s3://$BUCKET/" --recursive --region "$AWS_REGION" 2>/dev/null | wc -l | tr -d ' ')
  if [ "$OBJECT_COUNT" -gt 0 ]; then
    aws s3 rm "s3://$BUCKET/" --recursive --region "$AWS_REGION" --quiet
    ok "Removed $OBJECT_COUNT object(s) from S3"
  else
    ok "Bucket already empty"
  fi
fi

# ── Terraform destroy ─────────────────────────────────────────
log "Running terraform destroy..."
terraform -chdir="$TF_DIR" destroy \
  -auto-approve -input=false \
  -var "student_name=$STUDENT_NAME" \
  -var "aws_region=$AWS_REGION"
ok "Infrastructure destroyed"

# ── Clean up local build artifacts ───────────────────────────
log "Cleaning up local artifacts..."
[ -f "$BACKEND_DIR/lambda.zip" ] && rm -f "$BACKEND_DIR/lambda.zip" && ok "Removed backend/lambda.zip"
[ -d "$ROOT_DIR/frontend/out" ]  && rm -rf "$ROOT_DIR/frontend/out"  && ok "Removed frontend/out/"
[ -d "$ROOT_DIR/frontend/.next" ] && rm -rf "$ROOT_DIR/frontend/.next" && ok "Removed frontend/.next/"

# ── Final summary ─────────────────────────────────────────────
hr
echo -e "  ${GREEN}${BOLD}✓  Destroy complete!${NC}"
hr
echo ""
echo    "  All AWS resources have been removed."
echo    "  No further AWS charges will be incurred."
echo ""
echo -e "  ${CYAN}To redeploy:${NC}  bash $SCRIPT_DIR/deploy.sh"
echo ""
