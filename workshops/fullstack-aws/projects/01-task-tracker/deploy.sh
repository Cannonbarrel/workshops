#!/bin/bash
set -e

MODE=$1

if [ -z "$MODE" ]; then
  echo "Usage: ./deploy.sh [backend|frontend|all]"
  exit 1
fi

# Load Terraform outputs
TF_DIR="$(dirname "$0")/terraform"
S3_BUCKET=$(terraform -chdir="$TF_DIR" output -raw s3_bucket)
LAMBDA_NAME=$(terraform -chdir="$TF_DIR" output -raw lambda_function_name)
CF_DIST_ID=$(terraform -chdir="$TF_DIR" output -raw cloudfront_distribution_id)
API_URL=$(terraform -chdir="$TF_DIR" output -raw api_url)

deploy_backend() {
  echo "==> Building Lambda package..."
  BACKEND_DIR="$(dirname "$0")/backend"
  BUILD_DIR="/tmp/task-tracker-lambda"

  rm -rf "$BUILD_DIR" && mkdir "$BUILD_DIR"
  pip3 install -r "$BACKEND_DIR/requirements.txt" -t "$BUILD_DIR" -q
  cp "$BACKEND_DIR/lambda_function.py" "$BUILD_DIR/"
  zip -r "$BACKEND_DIR/lambda.zip" "$BUILD_DIR" -x "*.pyc" -x "*/__pycache__/*" -q

  echo "==> Deploying Lambda..."
  aws lambda update-function-code \
    --function-name "$LAMBDA_NAME" \
    --zip-file fileb://"$BACKEND_DIR/lambda.zip" \
    --query 'FunctionName' --output text

  echo "Backend deployed."
}

deploy_frontend() {
  echo "==> Building React app..."
  FRONTEND_DIR="$(dirname "$0")/frontend"

  cd "$FRONTEND_DIR"
  VITE_API_URL="$API_URL" npm run build

  echo "==> Uploading to S3..."
  aws s3 sync dist/ "s3://$S3_BUCKET/" --delete

  echo "==> Invalidating CloudFront cache..."
  aws cloudfront create-invalidation \
    --distribution-id "$CF_DIST_ID" \
    --paths "/*" \
    --query 'Invalidation.Id' --output text

  echo "Frontend deployed."
}

case "$MODE" in
  backend)  deploy_backend ;;
  frontend) deploy_frontend ;;
  all)      deploy_backend && deploy_frontend ;;
  *)
    echo "Unknown mode: $MODE. Use backend, frontend, or all."
    exit 1
    ;;
esac

echo ""
echo "Done! App URL: https://$(terraform -chdir="$TF_DIR" output -raw cloudfront_url 2>/dev/null || echo 'check terraform outputs')"
