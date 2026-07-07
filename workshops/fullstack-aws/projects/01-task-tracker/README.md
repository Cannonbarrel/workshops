# Task Tracker — Capstone Project

A full-stack serverless task management app built with React, Python Lambda, MongoDB, and deployed on AWS.

## Architecture

The app is split into two independent flows:


**Architecture Flow view**
```
                        ┌─────────────────────┐
                        │    User's Browser    │
                        └──────────┬──────────┘
                                   │
               ┌───────────────────┴───────────────────┐
               │ Page Load                             │ API Calls
               ▼                                       ▼
      ┌─────────────────┐                  ┌─────────────────────┐
      │   CloudFront    │                  │    API Gateway      │
      │   (CDN / HTTPS) │                  │    (HTTP API)       │
      └────────┬────────┘                  └──────────┬──────────┘
               │                                      │
               ▼                                      ▼
      ┌─────────────────┐                  ┌─────────────────────┐
      │   Amazon S3     │                  │   AWS Lambda        │
      │ (React app      │                  │   (Python handler)  │
      │  static files)  │                  └──────────┬──────────┘
      └─────────────────┘                             │
                                                      ▼
                                           ┌─────────────────────┐
                                           │   MongoDB on EC2    │
                                           │   (task data store) │
                                           └─────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js + Material UI + React Responsive |
| Backend | Python (AWS Lambda) |
| Database | MongoDB on EC2 |
| Infrastructure | Terraform |
| Hosting | S3 + CloudFront + Lambda + API Gateway |
| Deployment | Shell Script |

## Features

- View all tasks in a Kanban board (Todo / In Progress / Done)
- Add a new task with title, description, and priority
- Update task status with one click
- Delete a task
- Responsive — works on mobile and desktop

---

## Project Structure

```
task-tracker/
├── frontend/                  ← React app
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api.js
│   │   └── components/
│   │       ├── TaskBoard.jsx
│   │       ├── TaskCard.jsx
│   │       └── TaskForm.jsx
│   ├── package.json
│   └── vite.config.js
├── backend/                   ← Lambda function
│   ├── lambda_function.py
│   └── requirements.txt
├── terraform/                 ← AWS infrastructure
│   ├── main.tf
│   ├── variables.tf
│   └── outputs.tf
└── deploy.sh                  ← One-command deployment
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.12+
- Terraform installed
- AWS CLI configured (`aws configure`)
- MongoDB running on EC2 (from Lab — Lambda MongoDB EC2)

### Step 1 — Build the Lambda package

Run once before deploying. Works on Windows, Mac, and Linux — only requires Python.

```bash
python build-lambda-pkg.py
```

This creates `backend/lambda.zip` with all dependencies bundled.

### Step 2 — Deploy infrastructure

```bash
cd terraform
terraform init
terraform apply
```

Copy the outputs — you will need them in the next steps:

```
api_url                    = "https://abc123.execute-api.us-east-1.amazonaws.com"
cloudfront_url             = "https://xyz.cloudfront.net"
s3_bucket                  = "student-john-smith-task-tracker-a1b2"
cloudfront_distribution_id = "E2TEUK2S7IPHG"
```

### Step 3 — Build and deploy frontend

The frontend must be built with the API URL so it knows where to send requests.

**Mac / Linux:**
```bash
cd ../frontend
npm install
VITE_API_URL=<your-api_url> npm run build
aws s3 sync dist/ s3://<your-s3_bucket>/ --delete
aws cloudfront create-invalidation \
  --distribution-id <your-cloudfront_distribution_id> \
  --paths "/*"
```

**Windows (Command Prompt):**
```cmd
cd ..\frontend
npm install
set VITE_API_URL=<your-api_url>
npm run build
aws s3 sync dist/ s3://<your-s3_bucket>/ --delete
aws cloudfront create-invalidation --distribution-id <your-cloudfront_distribution_id> --paths "/*"
```

Replace all `<your-...>` values with the outputs from Step 2.

### Step 4 — Open the app

1. Open the `cloudfront_url` from Terraform outputs in your browser
2. Wait ~30 seconds for the CloudFront invalidation to complete
3. Hard refresh: **Ctrl+Shift+R** (Windows) or **Cmd+Shift+R** (Mac)

You should see the Task Tracker Kanban board.

---

## Environment Variables (Lambda)

Set these in the Lambda console under **Configuration → Environment variables**:

| Key | Value |
|-----|-------|
| `MONGO_HOST` | EC2 public IP |
| `MONGO_PORT` | `27017` |
