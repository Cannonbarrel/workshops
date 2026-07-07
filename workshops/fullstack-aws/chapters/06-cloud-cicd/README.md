# Chapter 6 — Cloud, Infrastructure & CI/CD

Provision real cloud infrastructure, build serverless APIs, and automate deployments with GitHub Actions.

## Labs

| Lab | Description |
|-----|-------------|
| [Lab 01 — EC2 + CI/CD](./labs/lab-01-ec2-cicd.md) | Launch EC2 with Terraform, deploy nginx, automate with GitHub Actions |
| [Lab 02 — Lambda S3 Trigger](./labs/lab-02-lambda-s3-trigger.md) | Trigger a Lambda function on S3 file upload, view logs in CloudWatch |
| [Lab 03 — Lambda REST API](./labs/lab-03-lambda-rest-api.md) | Expose Lambda as a REST API via API Gateway (GET + POST) |
| [Lab 04 — Lambda + MongoDB](./labs/lab-04-lambda-mongodb.md) | Full serverless stack: API Gateway → Lambda → MongoDB on EC2 |

## Other Files

| File | Description |
|------|-------------|
| [iam-policies.md](./iam-policies.md) | IAM student policies — attach these to student IAM users |
| [terraform/](./terraform/) | Terraform template to provision EC2 with security groups |
| [scripts/ec2-setup.sh](./scripts/ec2-setup.sh) | EC2 bootstrap script |
| [starter-apps/hello-cicd/](./starter-apps/hello-cicd/) | Starter app used in the CI/CD lab |

## Prerequisites

- [ ] AWS CLI installed and configured (`aws configure`)
- [ ] Terraform installed (`terraform -version`)
- [ ] Git installed and GitHub account ready
- [ ] AWS IAM user with student policies attached (see [iam-policies.md](./iam-policies.md))
