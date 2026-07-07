#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Stash — URL Bookmark Saver  /  End-to-End Deploy
# Provisions: Lambda + API Gateway + DynamoDB + S3 + CloudWatch (Terraform)
# Then builds and uploads the Next.js frontend
#
# Usage:
#   bash scripts/deploy.sh
#   STUDENT_NAME=john-smith AWS_REGION=us-east-1 bash scripts/deploy.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
TF_DIR="$ROOT_DIR/terraform"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

log()  { echo -e "\n${BLUE}▶${NC} $*"; }
ok()   { echo -e "  ${GREEN}✓${NC} $*"; }
info() { echo -e "  ${CYAN}→${NC} $*"; }
warn() { echo -e "  ${YELLOW}!${NC} $*"; }
die()  { echo -e "\n${RED}✗ ERROR:${NC} $*\n" >&2; exit 1; }
hr()   { echo -e "\n${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; }

# ── Inputs ────────────────────────────────────────────────────
AWS_REGION="${AWS_REGION:-us-east-1}"
STUDENT_NAME="${STUDENT_NAME:-}"
CI_MODE="${CI:-false}"
SEED_DEMO_DATA="${SEED_DEMO_DATA:-false}"
DEMO_SEED_COUNT="${DEMO_SEED_COUNT:-18}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --name)   STUDENT_NAME="$2"; shift 2 ;;
    --region) AWS_REGION="$2";   shift 2 ;;
    *) die "Unknown argument: $1  Usage: bash deploy.sh --name john-smith [--region us-east-1]" ;;
  esac
done

if [ -z "$STUDENT_NAME" ] && [ "$CI_MODE" = "true" ]; then
  die "STUDENT_NAME must be set in CI. Example: STUDENT_NAME=john-smith bash scripts/deploy.sh"
fi

if [ -z "$STUDENT_NAME" ]; then
  echo ""
  read -rp "  Enter your name/ID (lowercase, hyphens only — e.g. john-smith): " STUDENT_NAME
fi
[[ "$STUDENT_NAME" =~ ^[a-z0-9-]+$ ]] || die "Name must be lowercase letters, numbers, and hyphens only."

hr
echo -e "  ${BOLD}Stash — URL Bookmark Saver${NC}  /  AWS Deployment"
echo    "  Name    : $STUDENT_NAME"
echo    "  Region  : $AWS_REGION"
hr

# ── Step 1: Prerequisites ─────────────────────────────────────
log "Checking prerequisites..."
for cmd in aws terraform node npm zip curl; do
  command -v "$cmd" &>/dev/null \
    && ok "$cmd  ($(command -v $cmd))" \
    || die "$cmd is not installed."
done

AWS_ACCOUNT=$(aws sts get-caller-identity --query 'Account' --output text 2>/dev/null) \
  || die "AWS credentials not configured. Run: aws configure"
ok "AWS account: $AWS_ACCOUNT  (region: $AWS_REGION)"

# ── Step 2: Package Lambda ────────────────────────────────────
log "Installing backend dependencies..."
(cd "$BACKEND_DIR" && npm ci --omit=dev --silent)
ok "node_modules ready"

log "Building lambda.zip..."
rm -f "$BACKEND_DIR/lambda.zip"
(cd "$BACKEND_DIR" && zip -r lambda.zip src/ node_modules/ -q)
ok "lambda.zip  ($(du -sh "$BACKEND_DIR/lambda.zip" | cut -f1))"

# ── Step 3: Terraform ─────────────────────────────────────────
log "Initialising Terraform..."
terraform -chdir="$TF_DIR" init -upgrade -input=false -no-color \
  2>&1 | grep -E "^(Terraform|Error|Warning|Initializing)" || true
ok "Terraform ready"

log "Provisioning AWS infrastructure..."
terraform -chdir="$TF_DIR" apply \
  -auto-approve -input=false \
  -var "student_name=$STUDENT_NAME" \
  -var "aws_region=$AWS_REGION"

# ── Step 4: Capture Terraform outputs ────────────────────────
log "Reading deployment outputs..."
API_URL=$(terraform -chdir="$TF_DIR" output -raw api_url)
FRONTEND_URL=$(terraform -chdir="$TF_DIR" output -raw frontend_url)
BUCKET=$(terraform -chdir="$TF_DIR" output -raw frontend_bucket)
TABLE=$(terraform -chdir="$TF_DIR" output -raw table_name)
FN=$(terraform -chdir="$TF_DIR" output -raw function_name)
DASHBOARD=$(terraform -chdir="$TF_DIR" output -raw dashboard_url)
LOG_GROUP=$(terraform -chdir="$TF_DIR" output -raw log_group)
ok "API URL  : $API_URL"
ok "Frontend : $FRONTEND_URL"

# ── Step 5: Build Next.js frontend ───────────────────────────
log "Installing frontend dependencies..."
(cd "$FRONTEND_DIR" && npm install --silent)
ok "Frontend packages ready"

log "Building Next.js (static export)..."
(cd "$FRONTEND_DIR" && NEXT_PUBLIC_API_URL="$API_URL" npm run build)
ok "Frontend built  → $FRONTEND_DIR/out/"

# ── Step 6: Upload to S3 ─────────────────────────────────────
log "Uploading frontend to S3..."
aws s3 sync "$FRONTEND_DIR/out/" "s3://$BUCKET/" \
  --delete \
  --region "$AWS_REGION" \
  --cache-control "public,max-age=300" \
  --quiet
ok "Frontend uploaded to s3://$BUCKET/"

# Set index.html cache to no-cache so updates are immediate
aws s3 cp "s3://$BUCKET/index.html" "s3://$BUCKET/index.html" \
  --metadata-directive REPLACE \
  --cache-control "no-cache,no-store,must-revalidate" \
  --content-type "text/html" \
  --region "$AWS_REGION" \
  --quiet 2>/dev/null || true

# ── Step 7: Live API verification ────────────────────────────
log "Verifying live API (allowing Gateway to warm up)..."
sleep 4

# GET /bookmarks
GET_RESPONSE=$(curl -s -w "\n%{http_code}" "${API_URL}/bookmarks")
GET_BODY=$(echo "$GET_RESPONSE" | head -1)
GET_STATUS=$(echo "$GET_RESPONSE" | tail -1)
if [ "$GET_STATUS" = "200" ]; then
  ok "GET  /bookmarks  →  HTTP $GET_STATUS"
  info "Response: $GET_BODY"
else
  warn "GET  /bookmarks  →  HTTP $GET_STATUS"
fi

# POST a test bookmark
POST_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/bookmarks" \
  -H "Content-Type: application/json" \
  -d '{"title":"AWS Documentation","url":"https://docs.aws.amazon.com"}')
POST_BODY=$(echo "$POST_RESPONSE" | head -1)
POST_STATUS=$(echo "$POST_RESPONSE" | tail -1)
if [ "$POST_STATUS" = "201" ]; then
  ok "POST /bookmarks  →  HTTP $POST_STATUS"
  info "Created: $POST_BODY"
else
  warn "POST /bookmarks  →  HTTP $POST_STATUS"
fi

# ── Step 8: Optional demo data seed ───────────────────────────
if [ "$SEED_DEMO_DATA" = "true" ]; then
  log "Seeding demo traffic and sample bookmarks..."
  bash "$SCRIPT_DIR/demo-load.sh" \
    --api-url "$API_URL" \
    --count "$DEMO_SEED_COUNT" \
    --include-errors
  ok "Demo seed complete"
fi

# ── Step 9: Resource details ──────────────────────────────────
log "Fetching deployed resource details..."

LAMBDA_JSON=$(aws lambda get-function-configuration \
  --function-name "$FN" --region "$AWS_REGION" \
  --query '{ARN:FunctionArn,Runtime:Runtime,Memory:MemorySize,Timeout:Timeout,State:State}' \
  --output json 2>/dev/null || echo '{}')
ok "Lambda"
info "  Name    : $FN"
info "  ARN     : $(echo "$LAMBDA_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('ARN','n/a'))" 2>/dev/null || echo n/a)"
info "  Runtime : $(echo "$LAMBDA_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('Runtime','n/a'))" 2>/dev/null || echo n/a)"
info "  Memory  : $(echo "$LAMBDA_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('Memory','n/a'))" 2>/dev/null || echo n/a) MB"
info "  State   : $(echo "$LAMBDA_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('State','n/a'))" 2>/dev/null || echo n/a)"

TABLE_JSON=$(aws dynamodb describe-table \
  --table-name "$TABLE" --region "$AWS_REGION" \
  --query 'Table.{ARN:TableArn,Status:TableStatus,Items:ItemCount}' \
  --output json 2>/dev/null || echo '{}')
ok "DynamoDB"
info "  Name    : $TABLE"
info "  ARN     : $(echo "$TABLE_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('ARN','n/a'))" 2>/dev/null || echo n/a)"
info "  Status  : $(echo "$TABLE_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('Status','n/a'))" 2>/dev/null || echo n/a)"
info "  Billing : PAY_PER_REQUEST (on-demand)"

ok "CloudWatch"
info "  Log group : $LOG_GROUP"
info "  Dashboard : $DASHBOARD"

# ── Final summary ─────────────────────────────────────────────
hr
echo -e "  ${GREEN}${BOLD}✓  Deployment complete!${NC}"
hr
echo ""
echo -e "  ${BOLD}Frontend (open this in your browser):${NC}"
echo    "  $FRONTEND_URL"
echo ""
echo -e "  ${BOLD}API endpoints:${NC}"
echo    "  GET    ${API_URL}/bookmarks"
echo    "  POST   ${API_URL}/bookmarks"
echo    "  DELETE ${API_URL}/bookmarks/{id}"
echo ""
echo -e "  ${BOLD}AWS resources:${NC}"
echo    "  Lambda    : $FN"
echo    "  DynamoDB  : $TABLE"
echo    "  S3 bucket : $BUCKET"
echo    "  Dashboard : $DASHBOARD"
echo    "  Logs      : https://${AWS_REGION}.console.aws.amazon.com/cloudwatch/home?region=${AWS_REGION}#logsV2:log-groups/log-group/$(echo "$LOG_GROUP" | sed 's|/|$252F|g')"
echo ""
echo -e "  ${YELLOW}To tear down:  bash $SCRIPT_DIR/destroy.sh --name $STUDENT_NAME${NC}"
echo ""

# Try to open frontend in browser (macOS)
if [ "$CI_MODE" != "true" ] && command -v open &>/dev/null; then
  open "$FRONTEND_URL" 2>/dev/null && echo "  (Opened in browser)" || true
fi
