#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
TF_DIR="$ROOT_DIR/terraform"

API_URL="${API_URL:-}"
COUNT="${COUNT:-12}"
INCLUDE_ERRORS=false

titles=(
  "beCloudReady DevOps Launchpad"
  "beCloudReady Job-Ready DevOps Program"
  "beCloudReady For Devs Network"
  "beCloudReady DevRel Services"
  "beCloudReady Hire Talent"
  "TorontoAI Community Hub"
  "TorontoAI Upcoming Events"
  "TorontoAI Demo Night Recap Dec 2025"
  "AWS Lambda Powertools Guide"
  "DynamoDB Single Table Design"
  "API Gateway HTTP API Docs"
  "CloudWatch Logs Insights Recipes"
  "Next.js App Router Patterns"
  "Terraform AWS Provider"
  "Serverless Land Patterns"
  "AWS Well-Architected Serverless Lens"
  "Node.js Lambda Best Practices"
  "GitHub Actions Deployment Docs"
  "Amazon S3 Static Hosting"
  "CloudFront Caching Strategies"
)

urls=(
  "https://www.becloudready.com/devops-launchpad"
  "https://www.becloudready.com/for-devops-launchpad"
  "https://www.becloudready.com/for-devs"
  "https://www.becloudready.com/dev-rel-services"
  "https://www.becloudready.com/hire-talent"
  "https://www.toronto-ai.org/"
  "https://www.toronto-ai.org/upcoming-events"
  "https://toronto-ai.org/blog/demo-night-dec-2025"
  "https://docs.aws.amazon.com/lambda/"
  "https://aws.amazon.com/dynamodb/"
  "https://docs.aws.amazon.com/apigateway/"
  "https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/CWL_QuerySyntax.html"
  "https://nextjs.org/docs"
  "https://registry.terraform.io/providers/hashicorp/aws/latest/docs"
  "https://serverlessland.com/patterns"
  "https://docs.aws.amazon.com/wellarchitected/latest/serverless-applications-lens/welcome.html"
  "https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html"
  "https://docs.github.com/actions"
  "https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html"
  "https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Introduction.html"
)

usage() {
  cat <<'EOF'
Usage:
  bash scripts/demo-load.sh --api-url https://example.execute-api.us-east-1.amazonaws.com
  bash scripts/demo-load.sh --count 20 --include-errors

Options:
  --api-url <url>       API base URL. If omitted, the script reads terraform output api_url.
  --count <n>           Number of sample bookmarks to create. Default: 12
  --include-errors      Send a couple of invalid requests to light up 4XX metrics.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --api-url) API_URL="$2"; shift 2 ;;
    --count) COUNT="$2"; shift 2 ;;
    --include-errors) INCLUDE_ERRORS=true; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown argument: $1" >&2; usage; exit 1 ;;
  esac
done

if [ -z "$API_URL" ]; then
  API_URL="$(terraform -chdir="$TF_DIR" output -raw api_url 2>/dev/null || true)"
fi

if [ -z "$API_URL" ]; then
  echo "Could not determine API URL. Pass --api-url or deploy the Terraform stack first." >&2
  exit 1
fi

if ! [[ "$COUNT" =~ ^[0-9]+$ ]] || [ "$COUNT" -lt 1 ]; then
  echo "--count must be a positive integer." >&2
  exit 1
fi

API_URL="${API_URL%/}"
created_ids=()

echo "Generating demo traffic against: $API_URL"
echo "Creating $COUNT bookmark(s)..."

for ((i = 0; i < COUNT; i++)); do
  idx=$((i % ${#titles[@]}))
  title="${titles[$idx]} #$((i + 1))"
  url="${urls[$idx]}?demo=$((i + 1))"

  body=$(printf '{"title":"%s","url":"%s"}' "$title" "$url")
  response=$(curl -sS -w "\n%{http_code}" -X POST "$API_URL/bookmarks" \
    -H "Content-Type: application/json" \
    -d "$body")
  response_body=$(echo "$response" | head -1)
  status=$(echo "$response" | tail -1)

  if [ "$status" != "201" ]; then
    echo "Failed to create bookmark $((i + 1)) (HTTP $status): $response_body" >&2
    exit 1
  fi

  bookmark_id=$(echo "$response_body" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')
  if [ -n "$bookmark_id" ]; then
    created_ids+=("$bookmark_id")
  fi

  if (( (i + 1) % 4 == 0 )); then
    curl -sS "$API_URL/bookmarks" >/dev/null
  fi
done

echo "Created ${#created_ids[@]} bookmark(s)."

if [ "${#created_ids[@]}" -gt 2 ]; then
  echo "Deleting a couple of bookmarks to exercise DELETE metrics..."
  for bookmark_id in "${created_ids[0]}" "${created_ids[1]}"; do
    curl -sS -X DELETE "$API_URL/bookmarks/$bookmark_id" >/dev/null
  done
fi

curl -sS "$API_URL/bookmarks" >/dev/null

if [ "$INCLUDE_ERRORS" = true ]; then
  echo "Sending a few invalid requests to populate 4XX charts..."
  curl -sS -o /dev/null -X POST "$API_URL/bookmarks" \
    -H "Content-Type: application/json" \
    -d '{"title":"","url":"notaurl"}' || true
  curl -sS -o /dev/null -X POST "$API_URL/bookmarks" \
    -H "Content-Type: application/json" \
    -d '{"title":"Bad URL","url":"ftp://invalid.example"}' || true
  curl -sS -o /dev/null "$API_URL/not-a-route" || true
fi

echo "Demo traffic complete."
