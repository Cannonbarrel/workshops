# IAM Student Group Policies

Attach all policies to a single IAM Group (e.g. `StudentGroup`).
Add student IAM users to that group.

## Policy Summary

| Policy Name | Services Covered | Used In |
|-------------|-----------------|---------|
| `StudentEC2Policy` | EC2 | Chapter 5 |
| `StudentS3Policy` | S3 | Chapter 6, 7 |
| `StudentCloudFrontPolicy` | CloudFront | Chapter 6, 7 |
| `StudentLambdaPolicy` | Lambda | Chapter 6, 7 |
| `StudentAPIGatewayPolicy` | API Gateway | Chapter 6, 7 |
| `StudentIAMPolicy` | IAM (scoped to Lambda roles only) | Chapter 6, 7 |
| `StudentTaggingPolicy` | Resource Groups Tagging API | Chapter 6, 7 |
| `StudentCloudWatchPolicy` | CloudWatch Metrics & Logs | Chapter 6, 7 |
| `StudentSelfServicePolicy` | IAM self-service (change own password) | All chapters |

---

## Policy 1 — StudentEC2Policy

> Allows launching t2.micro/t3.micro in us-east-1 only. Covers Chapter 5 Terraform lab.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowRunInstancesRestricted",
      "Effect": "Allow",
      "Action": ["ec2:RunInstances"],
      "Resource": "*",
      "Condition": {
        "StringEquals": { "aws:RequestedRegion": "us-east-1" },
        "StringLike": { "ec2:InstanceType": ["t2.micro", "t3.micro"] }
      }
    },
    {
      "Sid": "AllowRunInstancesOnInstance",
      "Effect": "Allow",
      "Action": "ec2:RunInstances",
      "Resource": "arn:aws:ec2:us-east-1:YOUR_ACCOUNT_ID:instance/*",
      "Condition": {
        "StringEquals": { "aws:RequestedRegion": "us-east-1" },
        "StringLike": { "ec2:InstanceType": ["t2.micro", "t3.micro"] }
      }
    },
    {
      "Sid": "AllowRunInstancesSupportingResources",
      "Effect": "Allow",
      "Action": "ec2:RunInstances",
      "Resource": [
        "arn:aws:ec2:us-east-1::image/*",
        "arn:aws:ec2:us-east-1:YOUR_ACCOUNT_ID:network-interface/*",
        "arn:aws:ec2:us-east-1:YOUR_ACCOUNT_ID:volume/*",
        "arn:aws:ec2:us-east-1:YOUR_ACCOUNT_ID:subnet/*",
        "arn:aws:ec2:us-east-1:YOUR_ACCOUNT_ID:security-group/*",
        "arn:aws:ec2:us-east-1:YOUR_ACCOUNT_ID:key-pair/*"
      ],
      "Condition": {
        "StringEquals": { "aws:RequestedRegion": "us-east-1" }
      }
    },
    {
      "Sid": "AllowBasicEC2Describe",
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeInstances",
        "ec2:DescribeImages",
        "ec2:DescribeKeyPairs",
        "ec2:DescribeSecurityGroups",
        "ec2:DescribeSubnets",
        "ec2:DescribeVpcs",
        "ec2:DescribeInstanceTypes",
        "ec2:DescribeTags",
        "ec2:DescribeInstanceAttribute",
        "ec2:DescribeVolumes",
        "ec2:DescribeInstanceCreditSpecifications",
        "ec2:DescribeNetworkInterfaces",
        "ec2:DescribeAvailabilityZones",
        "ec2:DescribeAccountAttributes",
        "ec2:DescribeSecurityGroupRules"
      ],
      "Resource": "*"
    },
    {
      "Sid": "AllowKeyPairManagement",
      "Effect": "Allow",
      "Action": [
        "ec2:CreateKeyPair",
        "ec2:DeleteKeyPair",
        "ec2:ImportKeyPair"
      ],
      "Resource": "*"
    },
    {
      "Sid": "AllowSecurityGroupBasic",
      "Effect": "Allow",
      "Action": [
        "ec2:CreateSecurityGroup",
        "ec2:AuthorizeSecurityGroupIngress",
        "ec2:AuthorizeSecurityGroupEgress",
        "ec2:RevokeSecurityGroupIngress",
        "ec2:RevokeSecurityGroupEgress",
        "ec2:DeleteSecurityGroup"
      ],
      "Resource": "*"
    },
    {
      "Sid": "AllowStartStopTerminateOwnInstances",
      "Effect": "Allow",
      "Action": [
        "ec2:StartInstances",
        "ec2:StopInstances",
        "ec2:TerminateInstances"
      ],
      "Resource": "*"
    },
    {
      "Sid": "AllowCreateTags",
      "Effect": "Allow",
      "Action": ["ec2:CreateTags"],
      "Resource": "arn:aws:ec2:us-east-1:YOUR_ACCOUNT_ID:*",
      "Condition": {
        "StringEquals": {
          "ec2:CreateAction": ["RunInstances", "CreateSecurityGroup", "ImportKeyPair"]
        }
      }
    }
  ]
}
```

---

## Policy 2 — StudentS3Policy

> Allows creating and managing S3 buckets for frontend hosting and Lambda zip uploads.
> Buckets are restricted by a `student-` name prefix to limit blast radius.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "BucketOperations",
      "Effect": "Allow",
      "Action": [
        "s3:CreateBucket",
        "s3:DeleteBucket",
        "s3:ListBucket",
        "s3:GetBucketLocation",
        "s3:GetBucketWebsite",
        "s3:PutBucketWebsite",
        "s3:DeleteBucketWebsite",
        "s3:GetBucketPolicy",
        "s3:PutBucketPolicy",
        "s3:DeleteBucketPolicy",
        "s3:GetBucketPublicAccessBlock",
        "s3:PutBucketPublicAccessBlock",
        "s3:GetBucketAcl",
        "s3:PutBucketAcl",
        "s3:GetBucketCORS",
        "s3:PutBucketCORS",
        "s3:GetBucketTagging",
        "s3:PutBucketTagging",
        "s3:GetBucketVersioning",
        "s3:PutBucketVersioning",
        "s3:GetBucketRequestPayment",
        "s3:GetBucketLogging",
        "s3:GetBucketNotification",
        "s3:PutBucketNotification",
        "s3:GetEncryptionConfiguration",
        "s3:PutEncryptionConfiguration",
        "s3:GetLifecycleConfiguration",
        "s3:GetReplicationConfiguration",
        "s3:GetAccelerateConfiguration",
        "s3:GetBucketObjectLockConfiguration"
      ],
      "Resource": "arn:aws:s3:::student-*"
    },
    {
      "Sid": "ObjectOperations",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:GetObjectAcl",
        "s3:PutObjectAcl"
      ],
      "Resource": "arn:aws:s3:::student-*/*"
    },
    {
      "Sid": "ListAllBuckets",
      "Effect": "Allow",
      "Action": "s3:ListAllMyBuckets",
      "Resource": "*"
    }
  ]
}
```

> **Note:** Your Terraform `main.tf` bucket name must start with `student-`. Update the resource block:
> ```hcl
> resource "aws_s3_bucket" "frontend" {
>   bucket = "student-employee-app-${random_id.suffix.hex}"
> }
> ```

---

## Policy 3 — StudentCloudFrontPolicy

> Allows creating and managing CloudFront distributions and cache invalidations.
> CloudFront is a global service — region conditions cannot be applied.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CloudFrontDistributionManagement",
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateDistribution",
        "cloudfront:UpdateDistribution",
        "cloudfront:DeleteDistribution",
        "cloudfront:GetDistribution",
        "cloudfront:GetDistributionConfig",
        "cloudfront:ListDistributions",
        "cloudfront:TagResource",
        "cloudfront:UntagResource",
        "cloudfront:ListTagsForResource"
      ],
      "Resource": "arn:aws:cloudfront::YOUR_ACCOUNT_ID:distribution/*"
    },
    {
      "Sid": "CloudFrontInvalidation",
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation",
        "cloudfront:GetInvalidation",
        "cloudfront:ListInvalidations"
      ],
      "Resource": "arn:aws:cloudfront::YOUR_ACCOUNT_ID:distribution/*"
    },
    {
      "Sid": "OriginAccessControl",
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateOriginAccessControl",
        "cloudfront:GetOriginAccessControl",
        "cloudfront:GetOriginAccessControlConfig",
        "cloudfront:UpdateOriginAccessControl",
        "cloudfront:DeleteOriginAccessControl",
        "cloudfront:ListOriginAccessControls"
      ],
      "Resource": "arn:aws:cloudfront::YOUR_ACCOUNT_ID:origin-access-control/*"
    }
  ]
}
```

---

## Policy 4 — StudentLambdaPolicy

> Allows creating and updating Lambda functions in us-east-1.
> Function names must be prefixed with `student-` to limit scope.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "LambdaFunctionManagement",
      "Effect": "Allow",
      "Action": [
        "lambda:CreateFunction",
        "lambda:UpdateFunctionCode",
        "lambda:UpdateFunctionConfiguration",
        "lambda:DeleteFunction",
        "lambda:GetFunction",
        "lambda:GetFunctionConfiguration",
        "lambda:InvokeFunction",
        "lambda:TagResource",
        "lambda:UntagResource",
        "lambda:ListTags"
      ],
      "Resource": "arn:aws:lambda:*:YOUR_ACCOUNT_ID:function:student-*"
    },
    {
      "Sid": "LambdaListAll",
      "Effect": "Allow",
      "Action": [
        "lambda:ListFunctions",
        "lambda:ListVersionsByFunction"
      ],
      "Resource": "*"
    },
    {
      "Sid": "LambdaPermissions",
      "Effect": "Allow",
      "Action": [
        "lambda:AddPermission",
        "lambda:RemovePermission",
        "lambda:GetPolicy"
      ],
      "Resource": "arn:aws:lambda:*:YOUR_ACCOUNT_ID:function:student-*"
    },
    {
      "Sid": "LambdaWaitForUpdate",
      "Effect": "Allow",
      "Action": [
        "lambda:GetFunctionCodeSigningConfig",
        "lambda:ListFunctionEventInvokeConfigs",
        "lambda:GetRuntimeManagementConfig"
      ],
      "Resource": "arn:aws:lambda:*:YOUR_ACCOUNT_ID:function:student-*"
    }
  ]
}
```

---

## Policy 5 — StudentAPIGatewayPolicy

> Allows full management of API Gateway resources in us-east-1.
> API Gateway uses a path-based ARN — restrict to student-tagged APIs where possible.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "APIGatewayFullManagement",
      "Effect": "Allow",
      "Action": [
        "apigateway:GET",
        "apigateway:POST",
        "apigateway:PUT",
        "apigateway:DELETE",
        "apigateway:PATCH"
      ],
      "Resource": [
        "arn:aws:apigateway:us-east-1::/apis",
        "arn:aws:apigateway:us-east-1::/apis/*",
        "arn:aws:apigateway:us-east-1::/restapis",
        "arn:aws:apigateway:us-east-1::/restapis/*"
      ]
    },
    {
      "Sid": "APIGatewayConsoleSupport",
      "Effect": "Allow",
      "Action": [
        "apigateway:GET"
      ],
      "Resource": [
        "arn:aws:apigateway:us-east-1::/account",
        "arn:aws:apigateway:us-east-1::/tags/*",
        "arn:aws:apigateway:us-east-1::/usageplans",
        "arn:aws:apigateway:us-east-1::/usageplans/*",
        "arn:aws:apigateway:us-east-1::/apikeys",
        "arn:aws:apigateway:us-east-1::/apikeys/*",
        "arn:aws:apigateway:us-east-1::/vpclinks",
        "arn:aws:apigateway:us-east-1::/vpclinks/*",
        "arn:aws:apigateway:us-east-1::/domainnames",
        "arn:aws:apigateway:us-east-1::/domainnames/*"
      ]
    }
  ]
}
```

---

## Policy 6 — StudentIAMPolicy

> Allows creating IAM roles **only for Lambda** (restricted by trust policy and name prefix).
> Students cannot create admin roles or attach arbitrary policies.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CreateLambdaRoles",
      "Effect": "Allow",
      "Action": [
        "iam:CreateRole",
        "iam:DeleteRole",
        "iam:GetRole",
        "iam:TagRole",
        "iam:UntagRole",
        "iam:ListRoleTags",
        "iam:ListAttachedRolePolicies",
        "iam:ListRolePolicies",
        "iam:GetRolePolicy"
      ],
      "Resource": [
        "arn:aws:iam::YOUR_ACCOUNT_ID:role/student-*",
        "arn:aws:iam::YOUR_ACCOUNT_ID:role/service-role/student-*"
      ]
    },
    {
      "Sid": "CreateLambdaExecutionPolicy",
      "Effect": "Allow",
      "Action": [
        "iam:CreatePolicy",
        "iam:DeletePolicy",
        "iam:GetPolicy",
        "iam:GetPolicyVersion",
        "iam:ListPolicies"
      ],
      "Resource": "*"
    },
    {
      "Sid": "AttachLambdaBasicExecutionOnly",
      "Effect": "Allow",
      "Action": [
        "iam:AttachRolePolicy",
        "iam:DetachRolePolicy"
      ],
      "Resource": [
        "arn:aws:iam::YOUR_ACCOUNT_ID:role/student-*",
        "arn:aws:iam::YOUR_ACCOUNT_ID:role/service-role/student-*"
      ],
      "Condition": {
        "ArnLike": {
          "iam:PolicyARN": [
            "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            "arn:aws:iam::YOUR_ACCOUNT_ID:policy/*"
          ]
        }
      }
    },
    {
      "Sid": "PassRoleToLambdaOnly",
      "Effect": "Allow",
      "Action": "iam:PassRole",
      "Resource": [
        "arn:aws:iam::YOUR_ACCOUNT_ID:role/student-*",
        "arn:aws:iam::YOUR_ACCOUNT_ID:role/service-role/student-*"
      ],
      "Condition": {
        "StringEquals": {
          "iam:PassedToService": "lambda.amazonaws.com"
        }
      }
    }
  ]
}
```

> **Critical:** This policy only allows attaching `AWSLambdaBasicExecutionRole`.
> Students cannot escalate to admin by attaching `AdministratorAccess` to their role.

---

## Policy 7 — StudentTaggingPolicy

> Allows reading and managing resource tags across all AWS services.
> Required for the Lambda and S3 consoles to display and manage tags.
> `tag:*` actions always require `Resource: "*"` — the Tagging API does not support resource-level restrictions.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowResourceTagging",
      "Effect": "Allow",
      "Action": [
        "tag:GetResources",
        "tag:TagResources",
        "tag:UntagResources",
        "tag:GetTagKeys",
        "tag:GetTagValues"
      ],
      "Resource": "*"
    }
  ]
}
```

---

## Policy 8 — StudentCloudWatchPolicy

> Allows viewing CloudWatch metrics and logs — required for the Lambda Monitor tab (invocation counts, errors, duration graphs, and log streams).

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CloudWatchMetrics",
      "Effect": "Allow",
      "Action": [
        "cloudwatch:GetMetricData",
        "cloudwatch:GetMetricStatistics",
        "cloudwatch:ListMetrics",
        "cloudwatch:DescribeAlarms",
        "cloudwatch:DescribeAlarmsForMetric",
        "cloudwatch:GetDashboard",
        "cloudwatch:ListDashboards"
      ],
      "Resource": "*"
    },
    {
      "Sid": "CloudWatchLogs",
      "Effect": "Allow",
      "Action": [
        "logs:DescribeLogGroups",
        "logs:DescribeLogStreams",
        "logs:GetLogEvents",
        "logs:FilterLogEvents",
        "logs:StartQuery",
        "logs:StopQuery",
        "logs:GetQueryResults",
        "logs:DescribeQueries",
        "logs:DescribeSubscriptionFilters",
        "logs:ListTagsLogGroup",
        "logs:ListTagsForResource",
        "logs:GetLogGroupFields",
        "logs:GetLogRecord",
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*"
    },
    {
      "Sid": "XRayTracing",
      "Effect": "Allow",
      "Action": [
        "xray:GetTraceSummaries",
        "xray:BatchGetTraces",
        "xray:GetServiceGraph",
        "xray:GetTraceGraph"
      ],
      "Resource": "*"
    }
  ]
}
```

---

## Policy 9 — StudentSelfServicePolicy

> Allows students to change their own password after first login and view the account password policy.
> Scoped to the calling user only via `aws:username` condition — students cannot change anyone else's password.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowSelfService",
      "Effect": "Allow",
      "Action": [
        "iam:ChangePassword",
        "iam:GetUser",
        "iam:CreateAccessKey",
        "iam:DeleteAccessKey",
        "iam:ListAccessKeys",
        "iam:UpdateAccessKey"
      ],
      "Resource": "arn:aws:iam::*:user/${aws:username}"
    },
    {
      "Sid": "AllowIAMConsoleReads",
      "Effect": "Allow",
      "Action": [
        "iam:GetAccountPasswordPolicy",
        "iam:ListUsers",
        "iam:ListGroups",
        "iam:GetAccountSummary"
      ],
      "Resource": "*"
    }
  ]
}
```

---

## Budget Control — $75 Spending Limit

> IAM policies cannot enforce a dollar limit directly. The correct approach is **AWS Budgets + Budget Actions** — when spending hits $75, AWS automatically attaches a Deny-All policy to the StudentGroup, blocking all further actions.

### How it works

```
Spending reaches $75 → AWS Budgets triggers action → Attaches DenyAllPolicy to StudentGroup → Students can no longer create resources
```

### Step 1 — Create the DenyAll policy

Create this policy in IAM. It will only be active when the budget action attaches it.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyAllWhenBudgetExceeded",
      "Effect": "Deny",
      "Action": "*",
      "Resource": "*"
    }
  ]
}
```

```bash
aws iam create-policy \
  --policy-name StudentDenyAllOnBudgetExceeded \
  --policy-document file://StudentDenyAllOnBudgetExceeded.json
```

### Step 2 — Create a Budget Actions IAM Role

AWS Budgets needs a role to attach/detach policies on your behalf:

```bash
# Create the trust policy file
cat > budget-trust.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "budgets.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create the role
aws iam create-role \
  --role-name BudgetActionsRole \
  --assume-role-policy-document file://budget-trust.json

# Attach the AWS managed policy for Budget Actions
aws iam attach-role-policy \
  --role-name BudgetActionsRole \
  --policy-arn arn:aws:iam::aws:policy/AWSBudgetsActionsWithAWSResourceControlAccess
```

### Step 3 — Create the Budget with Action

```bash
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
DENY_POLICY_ARN="arn:aws:iam::${ACCOUNT_ID}:policy/StudentDenyAllOnBudgetExceeded"
ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/BudgetActionsRole"

# Create the budget
aws budgets create-budget \
  --account-id "$ACCOUNT_ID" \
  --budget '{
    "BudgetName": "StudentGroupBudget",
    "BudgetLimit": { "Amount": "75", "Unit": "USD" },
    "TimeUnit": "MONTHLY",
    "BudgetType": "COST"
  }'

# Attach a Budget Action — applies DenyAll to StudentGroup at 100% of $75
aws budgets create-budget-action \
  --account-id "$ACCOUNT_ID" \
  --budget-name "StudentGroupBudget" \
  --notification-type ACTUAL \
  --action-type APPLY_IAM_POLICY \
  --action-threshold '{"ActionThresholdValue": 100, "ActionThresholdType": "PERCENTAGE"}' \
  --definition "{
    \"IamActionDefinition\": {
      \"PolicyArn\": \"${DENY_POLICY_ARN}\",
      \"Groups\": [\"StudentGroup\"]
    }
  }" \
  --execution-role-arn "$ROLE_ARN" \
  --approval-model AUTOMATIC
```

### Step 4 — Add an email alert at $50 (early warning)

```bash
aws budgets create-notification \
  --account-id "$ACCOUNT_ID" \
  --budget-name "StudentGroupBudget" \
  --notification '{
    "NotificationType": "ACTUAL",
    "ComparisonOperator": "GREATER_THAN",
    "Threshold": 66,
    "ThresholdType": "PERCENTAGE"
  }' \
  --subscribers '[{
    "SubscriptionType": "EMAIL",
    "Address": "your-email@example.com"
  }]'
```

> This sends an alert at ~$50 (66% of $75) so you have time to act before the hard cutoff at $75.

### To manually re-enable students after the bootcamp resets

```bash
aws iam detach-group-policy \
  --group-name StudentGroup \
  --policy-arn "arn:aws:iam::${ACCOUNT_ID}:policy/StudentDenyAllOnBudgetExceeded"
```

---

## Setup Instructions

### Step 1 — Replace account ID

Replace `YOUR_ACCOUNT_ID` with your 12-digit AWS account ID in all policies above.

```bash
# Find your account ID
aws sts get-caller-identity --query Account --output text
```

### Step 2 — Create the IAM Group

```bash
aws iam create-group --group-name StudentGroup
```

### Step 3 — Create and attach each policy

```bash
# Repeat for each policy file
aws iam create-policy \
  --policy-name StudentEC2Policy \
  --policy-document file://StudentEC2Policy.json

aws iam attach-group-policy \
  --group-name StudentGroup \
  --policy-arn arn:aws:iam::YOUR_ACCOUNT_ID:policy/StudentEC2Policy
```

### Step 4 — Create student users and add to group

```bash
# Create user
aws iam create-user --user-name student01

# Add to group
aws iam add-user-to-group \
  --user-name student01 \
  --group-name StudentGroup

# Create access keys for programmatic access (Terraform/AWS CLI)
aws iam create-access-key --user-name student01
```

### Step 5 — Update Terraform naming convention

Ensure student Terraform configs use the `student-` prefix:

```hcl
variable "project_name" {
  default = "student-employee-app"
}
```

This ensures all created resources (Lambda, S3, IAM roles) fall within the scoped permissions.

---

## Resource Naming Rules for Students

| Resource | Required Prefix | Example |
|----------|----------------|---------|
| S3 Buckets | `student-` | `student-employee-app-a1b2` |
| Lambda Functions | `student-` | `student-employee-app-api` |
| IAM Roles | `student-` | `student-employee-app-lambda-role` |
| EC2 Key Pairs | any | restricted by region/type |

