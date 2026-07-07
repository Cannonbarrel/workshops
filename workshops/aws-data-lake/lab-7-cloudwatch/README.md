# Lab 7 — CloudWatch Alerts and Consolidated Dashboard

Two parts: a student exercise on alarms + SNS notifications, and an
instructor-only Terraform template that pre-builds a consolidated dashboard
for demo purposes.

## Lab guides

| File | Purpose |
|---|---|
| [student-lab-7-cloudwatch.md](student-lab-7-cloudwatch.md) | Student lab — billing alarm + EC2 CPU alarm, both wired to SNS email notifications. Points to official AWS step-by-step guides. |

## What students will learn

- How to create a CloudWatch alarm on a billing metric and on an EC2 metric
- How to create an SNS topic and email subscription
- How to wire an alarm to an SNS action
- How to force an alarm to fire and validate the notification path end to end

## What the instructor demo shows

- A single "Data Platform Overview" dashboard with live widgets across five
  services already running in the account, useful for showing students what
  production-grade observability looks like beyond a single alarm.

## Prerequisites

- AWS Console access in `us-west-2`
- For the student lab: ability to enable billing alerts (account-level
  setting, usually needs to be done once by an account admin ahead of time)
- For the instructor dashboard: Terraform >= 1.5, AWS credentials with
  `cloudwatch:PutDashboard` permission, and the names/IDs of existing
  Redshift, OpenSearch, Lambda, and Glue resources in the account
