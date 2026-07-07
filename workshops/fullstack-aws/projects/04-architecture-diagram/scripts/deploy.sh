#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Arcflow — Architecture Diagram Generator  /  Deploy
# Provisions: S3 static website (Terraform)
# Then builds and uploads the Next.js static export
#
# Usage:
#   bash scripts/deploy.sh --name john-smith [--region us-east-1]
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"
TF_DIR="$ROOT_DIR/terraform"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

log()  { echo -e "\n${BLUE}▶${NC} $*"; }
ok()   { echo -e "  ${GREEN}✓${NC} $*"; }
info() { echo -e "  ${CYAN}→${NC} $*"; }
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
    *) die "Unknown argument: $1  Usage: bash deploy.sh --name john-smith [--region us-east-1]" ;;
  esac
done

if [ -z "$STUDENT_NAME" ] && [ "$CI_MODE" = "true" ]; then
  die "STUDENT_NAME must be set in CI."
fi
if [ -z "$STUDENT_NAME" ]; then
  echo ""
  read -rp "  Enter your name/ID (lowercase, hyphens only — e.g. john-smith): " STUDENT_NAME
fi
[[ "$STUDENT_NAME" =~ ^[a-z0-9-]+$ ]] || die "Name must be lowercase letters, numbers, and hyphens only."

hr
echo -e "  ${BOLD}Arcflow — Architecture Diagram Generator${NC}  /  AWS Deployment"
echo    "  Name    : $STUDENT_NAME"
echo    "  Region  : $AWS_REGION"
hr

# ── Step 1: Prerequisites ─────────────────────────────────────────────────────
log "Checking prerequisites..."
for cmd in aws terraform node npm; do
  command -v "$cmd" &>/dev/null \
    && ok "$cmd  ($(command -v $cmd))" \
    || die "$cmd is not installed."
done

AWS_ACCOUNT=$(aws sts get-caller-identity --query 'Account' --output text 2>/dev/null) \
  || die "AWS credentials not configured. Run: aws configure"
ok "AWS account: $AWS_ACCOUNT  (region: $AWS_REGION)"

# ── Step 2: Provision S3 infrastructure ──────────────────────────────────────
log "Initialising Terraform..."
terraform -chdir="$TF_DIR" init -upgrade -input=false -no-color \
  2>&1 | grep -E "^(Terraform|Error|Warning|Initializing)" || true
ok "Terraform ready"

log "Provisioning S3 static website..."
terraform -chdir="$TF_DIR" apply \
  -auto-approve -input=false \
  -var "student_name=$STUDENT_NAME" \
  -var "aws_region=$AWS_REGION"

# ── Step 3: Capture outputs ───────────────────────────────────────────────────
log "Reading deployment outputs..."
FRONTEND_URL=$(terraform -chdir="$TF_DIR" output -raw frontend_url)
BUCKET=$(terraform -chdir="$TF_DIR" output -raw frontend_bucket)
ok "Frontend : $FRONTEND_URL"
ok "Bucket   : $BUCKET"

# ── Step 4: Build Next.js static export ──────────────────────────────────────
log "Installing frontend dependencies..."
(cd "$FRONTEND_DIR" && npm install --silent)
ok "Packages ready"

log "Building Next.js (static export)..."
(cd "$FRONTEND_DIR" && npm run build)
ok "Frontend built  → $FRONTEND_DIR/out/"

# ── Step 5: Upload to S3 ─────────────────────────────────────────────────────
log "Uploading to S3..."
aws s3 sync "$FRONTEND_DIR/out/" "s3://$BUCKET/" \
  --delete \
  --region "$AWS_REGION" \
  --cache-control "public,max-age=300" \
  --quiet

aws s3 cp "s3://$BUCKET/index.html" "s3://$BUCKET/index.html" \
  --metadata-directive REPLACE \
  --cache-control "no-cache,no-store,must-revalidate" \
  --content-type "text/html" \
  --region "$AWS_REGION" \
  --quiet 2>/dev/null || true

ok "Uploaded to s3://$BUCKET/"

# ── Final summary ─────────────────────────────────────────────────────────────
hr
echo -e "  ${GREEN}${BOLD}✓  Deployment complete!${NC}"
hr
echo ""
echo -e "  ${BOLD}Open in your browser:${NC}"
echo    "  $FRONTEND_URL"
echo ""
echo -e "  ${BOLD}AWS resources:${NC}"
echo    "  S3 bucket : $BUCKET"
echo ""
echo -e "  ${YELLOW}To tear down:  bash $SCRIPT_DIR/destroy.sh --name $STUDENT_NAME${NC}"
echo ""

if [ "$CI_MODE" != "true" ] && command -v open &>/dev/null; then
  open "$FRONTEND_URL" 2>/dev/null && echo "  (Opened in browser)" || true
fi
