# Chapter 5: Infrastructure as Code

Stop clicking through the AWS console. Define your infrastructure in code using Terraform and version-control it like any other software.

## Contents

| File | Description |
|------|-------------|
| [terraform/main.tf](./terraform/main.tf) | Starter Terraform config: AWS provider, basic resource |

## Prerequisites: Environment Setup

Do this once before running any command below.

### 1. Install the AWS CLI (v2)

- **macOS**: `curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg" && sudo installer -pkg AWSCLIV2.pkg -target /`
- **Linux**: `curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && unzip awscliv2.zip && sudo ./aws/install`
- **Windows**: download and run [AWSCLIV2.msi](https://awscli.amazonaws.com/AWSCLIV2.msi)

Full instructions for every OS/architecture: [AWS CLI install guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)

Verify:
```bash
aws --version
```

### 2. Configure your AWS credentials

Create an access key for yourself first: AWS Console → account menu (top right) → **Security credentials** → **Create access key**. (IAM → Users is locked down for students; use the Security credentials page, not the Users list.)

```bash
aws configure
# AWS Access Key ID:     <your access key>
# AWS Secret Access Key: <your secret key>
# Default region name:   us-east-1
# Default output format: json
```

Your student account is region-locked to `us-east-1` — any other region here will cause every AWS CLI and Terraform call to be denied.

Verify:
```bash
aws sts get-caller-identity
```
This should print your own IAM username, not an error.

### 3. Install Terraform

- **macOS (Homebrew)**: `brew tap hashicorp/tap && brew install hashicorp/tap/terraform`
- **Linux / Windows**: follow the [official install guide](https://developer.hashicorp.com/terraform/install) for your distro/package manager

Verify:
```bash
terraform -version
```

### 4. Run this chapter's Terraform config

```bash
cd chapters/05-infrastructure/terraform
terraform init
terraform plan  -var="created_date=<dd-Mon-yyyy>"
terraform apply -var="created_date=<dd-Mon-yyyy>"
```
`created_date` is required by `main.tf` (used for the `date` tag on created resources, format `dd-mmm-yyyy`, e.g. `17-Jul-2026`) — pass today's date.

## Learning Outcomes

- Understand what Infrastructure as Code (IaC) means
- Write and apply a basic Terraform configuration
- Use `terraform init`, `plan`, and `apply`
- Understand state files and why they matter
