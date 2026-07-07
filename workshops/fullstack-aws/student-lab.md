# Full-Stack on AWS — Student Onboarding

Welcome. By the end of this page you'll have:

1. Joined the GitHub org and activated Copilot
2. Signed in to the AWS console with your sandbox user
3. Confirmed you can create your first resource in your namespace

## 1 — GitHub

You should have received two emails from GitHub:

- **Org invite** to `becloudready` → click *Accept invitation*. You'll land on the cohort team page.
- **Copilot seat assignment** → no action needed; the seat is already active.

Verify Copilot is on:

```bash
# Open any .ts / .py file in VS Code — Copilot suggestions appear inline.
# If not: VS Code → Extensions → install "GitHub Copilot" → sign in with your GitHub account.
```

## 2 — AWS console

Your instructor will send you:

```
Console URL : https://{ACCOUNT_ID}.signin.aws.amazon.com/console
Username    : {your-username}
Password    : <temporary — you'll be forced to change it on first login>
Region      : us-east-1  (anything else is denied)
```

On sign-in:

- AWS will force a password change. Pick a strong one.
- The top-right region selector must read **US East (N. Virginia) us-east-1**. Anything else and most actions will be denied.

## 3 — Your namespace

Every resource you create must be named with the prefix `student-{your-slug}-`.

Your slug is the part of your username before the `@`. For example, if your username is `alice-johnson@quicklabs.internal`, your slug is `alice-johnson`.

Examples:

- S3 bucket: `student-alice-johnson-uploads`
- Lambda function: `student-alice-johnson-api`
- DynamoDB table: `student-alice-johnson-users`
- IAM role: `student-alice-johnson-lambda-exec`

Resources named any other way will be denied by the sandbox policy. When running bootcamp Terraform modules, pass your slug as:

```bash
terraform apply -var="student_name=alice-johnson"
```

## 4 — Smoke test

Run these before starting any lab to confirm your sandbox is working:

**S3:**
```bash
# Should succeed
aws s3 mb s3://student-{your-slug}-test --region us-east-1

# Should be denied (wrong prefix)
aws s3 mb s3://random-bucket-name --region us-east-1

# Clean up
aws s3 rb s3://student-{your-slug}-test
```

**Region lock:**
```bash
# Should be denied — us-west-2 is not allowed
aws s3 ls --region us-west-2
```

**IAM (confirm you can't escalate):**
```bash
# Should be denied
aws iam create-user --user-name test-user
```

If any of the "should succeed" steps fail, paste the full error (action + resource ARN) in Slack — your instructor will fix the sandbox policy.

## Getting help

- Cohort questions: post in your cohort Slack channel
- Stuck on AWS permissions: paste the full error message — your instructor will adjust the sandbox policy
