# Stash — URL Bookmark Saver

A production-style full-stack SaaS app for saving and organising bookmarks.  
Built with **Next.js + AWS Lambda + DynamoDB**, deployed via **Terraform**.

---

## Architecture

<img width="1087" height="285" alt="image" src="https://github.com/user-attachments/assets/10ccfbf1-52ad-4d74-b49e-c1bb137c98b6" />


| Layer       | Technology                        |
|-------------|-----------------------------------|
| Frontend    | Next.js 14, Tailwind CSS, TypeScript |
| API         | AWS API Gateway v2 (HTTP API)     |
| Backend     | AWS Lambda, Node.js 20.x          |
| Database    | AWS DynamoDB (PAY_PER_REQUEST)    |
| Hosting     | AWS S3 static website             |
| Monitoring  | CloudWatch Logs + Dashboard       |
| IaC         | Terraform ≥ 1.3                   |

---

## Prerequisites

| Tool      | Version | Install                                      |
|-----------|---------|----------------------------------------------|
| Node.js   | ≥ 18    | https://nodejs.org                           |
| npm       | ≥ 9     | bundled with Node                            |
| Terraform | ≥ 1.3   | https://developer.hashicorp.com/terraform    |
| AWS CLI   | ≥ 2     | https://aws.amazon.com/cli                   |
| zip       | any     | pre-installed on macOS/Linux                 |

**AWS credentials** must be configured (`aws configure`) with an IAM user that has permissions for: Lambda, API Gateway, DynamoDB, S3, IAM, CloudWatch.

---

## Local Development

Run the backend locally with a simple dev server, then start the Next.js frontend.

### 1. Start a local API (optional — if you want to test without AWS)

```bash
cd backend
npm install
# Quick local test server — not needed if testing against deployed API
node -e "
const http = require('http');
const bookmarks = [];
http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'GET') { res.end(JSON.stringify({ bookmarks })); return; }
  let body = '';
  req.on('data', d => body += d);
  req.on('end', () => {
    const { title, url } = JSON.parse(body || '{}');
    const item = { id: Date.now().toString(), title, url, createdAt: new Date().toISOString() };
    bookmarks.unshift(item);
    res.writeHead(201); res.end(JSON.stringify({ bookmark: item }));
  });
}).listen(3001, () => console.log('Mock API on http://localhost:3001'));
"
```

### 2. Start the Next.js frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local: NEXT_PUBLIC_API_URL=http://localhost:3001
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deployment (AWS)

One command deploys everything end-to-end:

```bash
bash scripts/deploy.sh
```

Or with environment variables (skips interactive prompts):

```bash
STUDENT_NAME=john-smith AWS_REGION=us-east-1 bash scripts/deploy.sh
```

### What deploy.sh does

| Step | Action |
|------|--------|
| 1 | Checks prerequisites (aws, terraform, node, npm, zip) |
| 2 | Runs `npm ci --production` in backend, creates `lambda.zip` |
| 3 | `terraform init && terraform apply` — provisions all AWS resources |
| 4 | Reads API URL from Terraform outputs |
| 5 | `npm run build` in frontend with `NEXT_PUBLIC_API_URL` injected |
| 6 | `aws s3 sync` uploads static site to S3 |
| 7 | Live API smoke test (GET + POST) |
| 8 | Prints all URLs and resource details |

### CI/CD with GitHub Actions

The repo includes `.github/workflows/deploy-url-bookmark-saver.yml`.

| Trigger | Behaviour |
|------|--------|
| Pull request touching `projects/03-url-bookmark-saver/**` | Builds backend + frontend and checks Terraform formatting |
| Push to `main` touching `projects/03-url-bookmark-saver/**` | Builds, deploys to AWS, and publishes URLs in the workflow summary |
| Manual `workflow_dispatch` | Re-runs deployment on demand |

Configure these GitHub repo settings before deploying:

| Type | Name | Purpose |
|------|------|---------|
| Variable | `URL_BOOKMARK_SAVER_STUDENT_NAME` | Required deployment suffix, e.g. `john-smith` |
| Variable | `URL_BOOKMARK_SAVER_AWS_REGION` | Optional AWS region, defaults to `us-east-1` |
| Variable | `URL_BOOKMARK_SAVER_SEED_DEMO_DATA` | Optional, defaults to `true` |
| Variable | `URL_BOOKMARK_SAVER_DEMO_SEED_COUNT` | Optional, defaults to `18` |
| Variable | `URL_BOOKMARK_SAVER_AWS_ROLE_ARN` | Preferred GitHub OIDC role ARN |
| Secret | `AWS_ACCESS_KEY_ID` | Fallback if not using OIDC |
| Secret | `AWS_SECRET_ACCESS_KEY` | Fallback if not using OIDC |

The workflow prefers OIDC when `URL_BOOKMARK_SAVER_AWS_ROLE_ARN` is set. Otherwise it falls back to classic AWS access keys.

### Expected output after deployment

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✓  Deployment complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Frontend (open this in your browser):
  http://student-john-smith-frontend-123456789012.s3-website-us-east-1.amazonaws.com

  API endpoints:
  GET    https://abc123.execute-api.us-east-1.amazonaws.com/bookmarks
  POST   https://abc123.execute-api.us-east-1.amazonaws.com/bookmarks
  DELETE https://abc123.execute-api.us-east-1.amazonaws.com/bookmarks/{id}

  AWS resources:
  Lambda    : student-john-smith-api
  DynamoDB  : student-john-smith-bookmarks
  S3 bucket : student-john-smith-frontend-123456789012
  Dashboard : https://us-east-1.console.aws.amazon.com/cloudwatch/home#dashboards:name=student-john-smith-dashboard
```

---

## Destroy

Remove all AWS resources and stop all charges:

```bash
bash scripts/destroy.sh --name john-smith
```

The script will:
1. Confirm before proceeding
2. Empty the S3 bucket (required before Terraform can delete it)
3. Run `terraform destroy`
4. Clean up local build artifacts (`lambda.zip`, `frontend/out/`)

---

## Demo Traffic and Dashboard

The CloudWatch dashboard is now more demo-friendly and includes:

- API request totals and HTTP error mix
- Lambda invocations, errors, and duration
- API Gateway latency plus 4XX and 5XX trends
- Bookmark created, deleted, and fetched activity
- DynamoDB read/write activity
- A live table of recent Lambda log events

To generate fresh activity for a class demo:

```bash
bash scripts/demo-load.sh --count 20 --include-errors
```

Or target a specific deployed API:

```bash
bash scripts/demo-load.sh --api-url https://abc123.execute-api.us-east-1.amazonaws.com --count 20 --include-errors
```

This script creates sample bookmarks, performs reads, deletes a couple of records, and intentionally triggers a few 4XX responses so the dashboard lights up quickly.

---

## Project Structure

```
03-url-bookmark-saver/
├── backend/
│   ├── src/
│   │   └── handler.js        # Lambda handler — all API routes
│   └── package.json
├── frontend/
│   ├── app/
│   │   ├── globals.css       # Tailwind + custom component classes
│   │   ├── layout.tsx        # HTML shell
│   │   └── page.tsx          # Main page — state + grid
│   ├── components/
│   │   ├── Header.tsx        # Top nav with Add button + count
│   │   ├── BookmarkCard.tsx  # Card with favicon, open, delete
│   │   ├── AddBookmarkModal.tsx  # Validated form modal
│   │   ├── EmptyState.tsx    # Zero-bookmark CTA
│   │   ├── SkeletonCard.tsx  # Loading placeholder
│   │   └── Toast.tsx         # Success/error notification
│   ├── lib/
│   │   └── api.ts            # Typed fetch wrapper
│   ├── types/
│   │   └── index.ts          # TypeScript interfaces
│   ├── .env.example
│   ├── next.config.js        # output: 'export' for S3 deploy
│   └── package.json
├── terraform/
│   ├── provider.tf           # AWS provider + versions
│   ├── variables.tf          # student_name, region, etc.
│   ├── main.tf               # All resources
│   └── outputs.tf            # URLs, names, ARNs
├── scripts/
│   ├── deploy.sh             # Full deploy pipeline
│   ├── demo-load.sh          # Generates demo traffic + sample bookmarks
│   └── destroy.sh            # Teardown
└── README.md
```

---

## API Reference

Base URL: `https://{api-id}.execute-api.{region}.amazonaws.com`

### GET /bookmarks
Returns all bookmarks, sorted newest first.

**Response 200**
```json
{
  "bookmarks": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "AWS Documentation",
      "url": "https://docs.aws.amazon.com",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### POST /bookmarks
Create a new bookmark.

**Request body**
```json
{ "title": "My Bookmark", "url": "https://example.com" }
```

**Response 201**
```json
{ "bookmark": { "id": "...", "title": "...", "url": "...", "createdAt": "..." } }
```

**Validation errors → 400**
```json
{ "error": "URL must start with http:// or https://" }
```

### DELETE /bookmarks/{id}
Delete a bookmark by ID.

**Response 200**
```json
{ "message": "Bookmark deleted" }
```

---

## Monitoring

### CloudWatch Dashboard
After deployment, the dashboard URL is printed. It now shows both platform health and app activity:
- API request totals and error mix
- Lambda invocations, errors, and p99 duration
- API Gateway latency plus 4XX/5XX trends
- Bookmark created, deleted, and fetched activity
- DynamoDB read/write activity
- Recent structured Lambda events in a logs table

### Structured Logs
Every Lambda invocation emits a structured JSON log line:

```json
{
  "level": "info",
  "message": "Bookmark created",
  "service": "stash-api",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "id": "550e8400-...",
  "durationMs": 23
}
```

View logs:
```bash
aws logs tail /aws/lambda/student-<name>-api --follow --region us-east-1
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `AccessDeniedException` during deploy | Attach IAM policies for Lambda, API GW, DynamoDB, S3, IAM, CloudWatch |
| `BucketAlreadyExists` | S3 bucket names are global — try a different `--name` |
| Frontend shows "Failed to load bookmarks" | Check `NEXT_PUBLIC_API_URL` was set correctly at build time; redeploy frontend |
| API returns 403 | Lambda permission for API Gateway may be missing — run `terraform apply` again |
| `lambda.zip not found` | Run `npm ci --production` in `backend/` then `zip -r lambda.zip src/ node_modules/` |
| Terraform state locked | `terraform force-unlock <lock-id>` |
| S3 bucket not empty on destroy | Script handles this automatically; if it fails, run `aws s3 rm s3://<bucket>/ --recursive` |

---

## Cost Estimate

All services are free-tier friendly for demos:

| Service | Free tier | Beyond free tier |
|---------|-----------|-----------------|
| Lambda | 1M requests/month | $0.20 per 1M requests |
| API Gateway | 1M HTTP calls/month | $1.00 per 1M |
| DynamoDB | 25 GB storage + 25 RCU/WCU | $1.25 per million writes |
| S3 | 5 GB + 20K GET/2K PUT | $0.023/GB |
| CloudWatch | 5 GB logs/month | $0.50/GB |

**Expected cost for a demo: $0**
