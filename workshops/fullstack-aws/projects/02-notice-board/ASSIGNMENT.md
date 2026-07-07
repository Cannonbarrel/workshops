# Notice Board — Assignment

## Overview

You are given a working Notice Board application with a React frontend and a Python Lambda backend.
Your job is to **deploy it to AWS** and progressively improve the deployment across 4 tiers.
Tiers 1–3 are the core path everyone must complete. Tier 4 (observability) is for students who finish early — pick it up once your app is live behind CloudFront and you have time left in the session.

The application is already built. You do not need to write frontend or backend code.
Your focus is entirely on **infrastructure, deployment, and automation**.

---

## What You Are Given

| File | Description |
|------|-------------|
| `frontend/` | React app (already built — do not modify) |
| `backend/lambda_function.py` | Python Lambda handler (already built — do not modify) |
| `backend/requirements.txt` | Python dependencies |
| `build.py` | Script to package the Lambda zip |

---

## Architecture

```
User's Browser
      │
      ├── Page Load ──────────────▶ Frontend Hosting (you decide where)
      │
      └── API Calls ──────────────▶ API Gateway ──▶ Lambda ──▶ MongoDB on EC2
```

---

## Before You Start

Make sure you have:
- [ ] AWS CLI configured (`aws configure`)
- [ ] Terraform installed
- [ ] Node.js 18+ installed
- [ ] Python 3 installed
- [ ] MongoDB running on EC2 (from Lab — Lambda MongoDB EC2)
- [ ] A GitHub account

---

## Tier 1 — Manual Deployment

**Goal:** Deploy the app manually using Terraform and AWS CLI. No automation yet.

### What to build

- An **S3 bucket** configured for static website hosting (public read access)
- A **Lambda function** running the Python backend
- An **API Gateway** (HTTP API) connected to the Lambda
- All resources named with your name as a prefix (e.g. `student-john-smith-notice-board`)

### Steps

1. Run `python build.py` to create `backend/lambda.zip`
2. Write `terraform/main.tf`, `terraform/variables.tf`, `terraform/outputs.tf`
3. Run `terraform init` and `terraform apply`
4. Build the React frontend with the API URL injected as `VITE_API_URL`
5. Upload the built frontend to S3 using the AWS CLI

### Acceptance Criteria

- [ ] Opening the S3 website URL shows the Notice Board UI
- [ ] Posting a notice saves it to MongoDB and appears on the page
- [ ] Deleting a notice removes it from the list
- [ ] All AWS resources are prefixed with `student-<your-name>`

### Hints

<details>
<summary>Hint — S3 static website</summary>

You need three things for a public S3 static website:
- `aws_s3_bucket`
- `aws_s3_bucket_public_access_block` with all `block_*` set to `false`
- `aws_s3_bucket_policy` allowing `s3:GetObject` for `Principal: "*"`
- `aws_s3_bucket_website_configuration` with `index_document = "index.html"`

</details>

<details>
<summary>Hint — Lambda zip</summary>

Run `python build.py` first. This creates `backend/lambda.zip`.
Terraform reads this file with `filename = "${path.module}/../backend/lambda.zip"`.

</details>

<details>
<summary>Hint — VITE_API_URL</summary>

Vite bakes environment variables into the build. Set it before running `npm run build`:

Mac/Linux: `VITE_API_URL=https://your-api-url npm run build`
Windows: `set VITE_API_URL=https://your-api-url` then `npm run build`

</details>

<details>
<summary>Hint — Upload to S3</summary>

```bash
aws s3 sync dist/ s3://<your-bucket-name>/ --delete
```

</details>

---

## Tier 2 — Automate with GitHub Actions

**Goal:** Eliminate the manual deploy steps. Every push to `main` automatically deploys both the backend and frontend.

### What to build

A GitHub Actions workflow file at `.github/workflows/deploy.yml` that:

1. Triggers on every push to the `main` branch
2. Packages and deploys the Lambda zip to AWS
3. Builds the React frontend (with `VITE_API_URL` set)
4. Uploads the built frontend to S3

### GitHub Secrets to configure

Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions** and add:

| Secret | Value |
|--------|-------|
| `AWS_ACCESS_KEY_ID` | Your AWS access key |
| `AWS_SECRET_ACCESS_KEY` | Your AWS secret key |
| `AWS_REGION` | `us-east-1` |
| `LAMBDA_FUNCTION_NAME` | Your Lambda function name from Terraform output |
| `S3_BUCKET` | Your S3 bucket name from Terraform output |
| `VITE_API_URL` | Your API Gateway URL from Terraform output |

### Acceptance Criteria

- [ ] Pushing a change to `main` triggers the workflow automatically
- [ ] The workflow completes without errors
- [ ] The updated app is live without any manual AWS CLI commands

### Hints

<details>
<summary>Hint — Workflow structure</summary>

```yaml
name: Deploy Notice Board

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      # configure AWS credentials
      # deploy backend (build zip, update Lambda)
      # deploy frontend (npm install, npm run build, s3 sync)
```

</details>

<details>
<summary>Hint — Configure AWS credentials</summary>

Use the official AWS action:
```yaml
- uses: aws-actions/configure-aws-credentials@v4
  with:
    aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
    aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    aws-region: ${{ secrets.AWS_REGION }}
```

</details>

<details>
<summary>Hint — Update Lambda from workflow</summary>

```bash
pip install pymongo -t backend/_build -q
cp backend/lambda_function.py backend/_build/
cd backend/_build && zip -r ../lambda.zip .
aws lambda update-function-code \
  --function-name ${{ secrets.LAMBDA_FUNCTION_NAME }} \
  --zip-file fileb://backend/lambda.zip
```

</details>

---

## Tier 3 — Add a CDN with CloudFront

**Goal:** Put CloudFront in front of the S3 bucket to serve the frontend over HTTPS with global edge caching.

### What to build

Modify your Terraform to add:

- A **CloudFront Origin Access Control (OAC)**
- A **CloudFront distribution** pointing to the S3 bucket
- Update the **S3 bucket policy** to allow access only from CloudFront (not public)
- Update the **S3 public access block** to block all public access
- Add a **cache invalidation** step in your GitHub Actions workflow after each frontend deploy

### Acceptance Criteria

- [ ] The app loads over **HTTPS** via the CloudFront URL
- [ ] The S3 bucket is **no longer publicly accessible** directly
- [ ] Pushing to `main` triggers a CloudFront cache invalidation automatically
- [ ] The site loads fast from different locations (use browser DevTools → Network to check)

### Hints

<details>
<summary>Hint — CloudFront OAC resource</summary>

```hcl
resource "aws_cloudfront_origin_access_control" "oac" {
  name                              = "${local.name}-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}
```

</details>

<details>
<summary>Hint — S3 bucket policy for CloudFront OAC</summary>

The bucket policy Principal must be `cloudfront.amazonaws.com` with a condition matching the CloudFront distribution ARN:

```json
{
  "Principal": { "Service": "cloudfront.amazonaws.com" },
  "Condition": {
    "StringEquals": {
      "AWS:SourceArn": "<your-cloudfront-distribution-arn>"
    }
  }
}
```

</details>

<details>
<summary>Hint — Cache invalidation in GitHub Actions</summary>

```bash
aws cloudfront create-invalidation \
  --distribution-id ${{ secrets.CF_DISTRIBUTION_ID }} \
  --paths "/*"
```

</details>

---

## Tier 4 — Observability with CloudWatch

**Goal:** Make the stack observable. Once Tiers 1–3 are done, your app is live but invisible — when a notice fails to save, the only way to find out why is to re-read code. Tier 4 fixes that. By the end you'll have bounded log retention, structured API Gateway access logs, CloudWatch alarms that transition to `ALARM` state on failure, a single CloudWatch dashboard, and two saved Logs Insights queries.

> **Prerequisite:** Tier 3 is done — app is served via CloudFront, GitHub Actions is deploying both backend and frontend on push.
> **Do not modify** `backend/lambda_function.py` — observability here is added through infrastructure (Terraform), not by changing the handler.
> **Scope:** This tier focuses on CloudWatch only — logs, metrics, alarms, dashboards, Logs Insights. No notification destinations (SNS / email / Slack / PagerDuty) — you can verify alarms by their state in the CloudWatch console.

### What to build

- A **`aws_cloudwatch_log_group`** for the Lambda function with `retention_in_days = 14` (Lambda otherwise auto-creates one with no retention — pay-forever logs)
- A second **`aws_cloudwatch_log_group`** for **API Gateway access logs** with the same retention
- **Access logging enabled** on the API Gateway stage, written as JSON
- A **CloudWatch alarm** on `AWS/Lambda` `Errors > 0` over a 5-minute window
- A **CloudWatch alarm** on `AWS/ApiGateway` `5xx > 0` over a 5-minute window
- A **CloudWatch dashboard** with widgets for: Lambda invocations / errors / p95 duration, API Gateway count / 4xx / 5xx / latency, CloudFront 4xxErrorRate / 5xxErrorRate
- Two saved **CloudWatch Logs Insights** queries (see hints) — proves you can introspect logs without re-reading code

### Steps

1. Add the two `aws_cloudwatch_log_group` resources. If you've already deployed Tier 1, the Lambda log group already exists — run `terraform import aws_cloudwatch_log_group.lambda /aws/lambda/<your-fn>` once before `terraform apply`.
2. Update your `aws_apigatewayv2_stage` block with an `access_log_settings { destination_arn, format }` pointing at the API Gateway log group.
3. Add two `aws_cloudwatch_metric_alarm` resources (Lambda Errors, API Gateway 5xx).
4. Add an `aws_cloudwatch_dashboard` resource with a `dashboard_body` JSON containing three widgets (Lambda, API Gateway, CloudFront).
5. Run `terraform apply` and confirm: both alarms start in `OK` state, the dashboard renders, and access log lines appear in CloudWatch after you hit the API.
6. Force a failure to verify alarms fire: edit the Lambda env var `MONGO_HOST` in the AWS console to an unreachable value, hit the API a few times from your browser, wait ~5 minutes. Refresh **CloudWatch → Alarms** (or run `aws cloudwatch describe-alarms --alarm-names <your-alarm>`) — the alarm should be in `ALARM`. Revert `MONGO_HOST` when done.
7. Open **CloudWatch → Logs Insights**, paste each of the two queries from the hints, and click **Save** with names like `notice-board-5xx-recent` and `notice-board-lambda-p95`.

### Acceptance Criteria

- [ ] Both log groups (`/aws/lambda/<fn>` and `/aws/apigateway/<name>-access`) are Terraform-managed and show a **14-day retention** (not "Never expire") in the console
- [ ] API Gateway access logs appear in CloudWatch as one JSON line per request (visible in Logs Insights)
- [ ] Forcing a Lambda error transitions the **Lambda Errors** alarm to `ALARM` within 5 minutes (verified in console or via `aws cloudwatch describe-alarms`)
- [ ] Forcing a 5XX transitions the **API Gateway 5xx** alarm to `ALARM`
- [ ] A single CloudWatch dashboard renders Lambda + API Gateway + CloudFront widgets at a glance
- [ ] Two saved Logs Insights queries appear under **Saved queries**

### Hints

<details>
<summary>Hint — Terraform-managed Lambda log group</summary>

Lambda auto-creates `/aws/lambda/<function-name>` on first invocation with no retention policy. To put it under Terraform without colliding, declare it with the exact name Lambda expects:

```hcl
resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${aws_lambda_function.app.function_name}"
  retention_in_days = 14
}
```

If the group already exists from earlier tiers, import it once before applying:

```bash
terraform import aws_cloudwatch_log_group.lambda /aws/lambda/<your-fn>
```

</details>

<details>
<summary>Hint — API Gateway access logs as JSON</summary>

```hcl
resource "aws_cloudwatch_log_group" "apigw_access" {
  name              = "/aws/apigateway/${local.name}-access"
  retention_in_days = 14
}

resource "aws_apigatewayv2_stage" "default" {
  # ... your existing fields ...

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.apigw_access.arn
    format = jsonencode({
      requestId          = "$context.requestId"
      ip                 = "$context.identity.sourceIp"
      method             = "$context.httpMethod"
      route              = "$context.routeKey"
      status             = "$context.status"
      responseLength     = "$context.responseLength"
      integrationStatus  = "$context.integrationStatus"
      integrationLatency = "$context.integrationLatency"
    })
  }
}
```

</details>

<details>
<summary>Hint — Lambda Errors alarm</summary>

```hcl
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${local.name}-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  threshold           = 0
  period              = 300
  statistic           = "Sum"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  dimensions = {
    FunctionName = aws_lambda_function.app.function_name
  }
  treat_missing_data = "notBreaching"
}
```

No `alarm_actions` for this tier — the alarm transitions to `ALARM` in the CloudWatch console and on the dashboard, which is what we're verifying. Wiring it to email / Slack / PagerDuty is a future enhancement (you'd add an SNS topic and set `alarm_actions = [aws_sns_topic.alerts.arn]`).

</details>

<details>
<summary>Hint — API Gateway 5XX alarm</summary>

For an **HTTP API** (`aws_apigatewayv2_api`) the metric is `5xx` (lowercase) with dimension `ApiId`:

```hcl
resource "aws_cloudwatch_metric_alarm" "apigw_5xx" {
  alarm_name          = "${local.name}-apigw-5xx"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  threshold           = 0
  period              = 300
  statistic           = "Sum"
  metric_name         = "5xx"
  namespace           = "AWS/ApiGateway"
  dimensions = {
    ApiId = aws_apigatewayv2_api.app.id
  }
  treat_missing_data = "notBreaching"
}
```

For a **REST API** (`aws_api_gateway_rest_api`) the metric is `5XXError` with dimensions `ApiName` + `Stage`. Match what you actually deployed.

</details>

<details>
<summary>Hint — CloudWatch dashboard</summary>

```hcl
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = local.name
  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0, y = 0, width = 12, height = 6
        properties = {
          title  = "Lambda"
          region = "us-east-1"
          period = 60
          metrics = [
            ["AWS/Lambda", "Invocations", "FunctionName", aws_lambda_function.app.function_name],
            [".", "Errors",   ".", "."],
            [".", "Duration", ".", ".", { stat = "p95" }]
          ]
        }
      },
      {
        type   = "metric"
        x      = 12, y = 0, width = 12, height = 6
        properties = {
          title  = "API Gateway"
          region = "us-east-1"
          period = 60
          metrics = [
            ["AWS/ApiGateway", "Count",   "ApiId", aws_apigatewayv2_api.app.id],
            [".", "4xx",     ".", "."],
            [".", "5xx",     ".", "."],
            [".", "Latency", ".", ".", { stat = "p95" }]
          ]
        }
      },
      {
        type   = "metric"
        x      = 0, y = 6, width = 24, height = 6
        properties = {
          title  = "CloudFront"
          region = "us-east-1"
          period = 300
          metrics = [
            ["AWS/CloudFront", "Requests",      "DistributionId", aws_cloudfront_distribution.app.id, "Region", "Global"],
            [".", "4xxErrorRate", ".", ".", ".", "."],
            [".", "5xxErrorRate", ".", ".", ".", "."]
          ]
        }
      }
    ]
  })
}
```

CloudFront metrics live in `us-east-1` only — the dashboard `region` field above is correct even if your other resources were in another region.

</details>

<details>
<summary>Hint — Useful CloudWatch Logs Insights queries</summary>

**Last 20 API Gateway 5XXs** (run against the access log group):

```
fields @timestamp, requestId, route, status, integrationStatus, integrationLatency
| filter status >= 500
| sort @timestamp desc
| limit 20
```

**Lambda p95 latency in 5-minute buckets** (run against `/aws/lambda/<fn>`):

```
filter @type = "REPORT"
| stats pct(@duration, 95) by bin(5m)
```

Click **Save** on each — they then appear under **Saved queries** for anyone in the cohort to reuse.

</details>

---

## Submission Checklist

| Tier | Requirement | Done |
|------|-------------|------|
| 1 | App is live on S3 website URL | [ ] |
| 1 | Can post and delete notices | [ ] |
| 1 | All resources prefixed with student name | [ ] |
| 2 | GitHub Actions workflow file exists | [ ] |
| 2 | Push to main triggers auto-deploy | [ ] |
| 3 | App served over HTTPS via CloudFront | [ ] |
| 3 | S3 bucket is private (not directly accessible) | [ ] |
| 3 | Workflow invalidates CloudFront cache on deploy | [ ] |
| 4 (optional) | Log groups have 14-day retention (not "Never expire") | [ ] |
| 4 (optional) | API Gateway access logs land in CloudWatch as JSON | [ ] |
| 4 (optional) | Lambda Errors alarm transitions to ALARM on a forced error | [ ] |
| 4 (optional) | API Gateway 5XX alarm transitions to ALARM on a forced 5XX | [ ] |
| 4 (optional) | Single CloudWatch dashboard shows Lambda + API Gateway + CloudFront | [ ] |
| 4 (optional) | Two saved Logs Insights queries (5XX recent, Lambda p95) | [ ] |
