# Lab 3 — Data Governance with Lake Formation

Apply fine-grained access control to your data lake using AWS Lake Formation — table grants, column masking, row filters, and tag-based permissions.

## Lab guide

| File | Purpose |
|---|---|
| [lakeformation-console-demo.md](lakeformation-console-demo.md) | Console walkthrough — register S3 location, grant table/column/row access, apply LF-Tags, verify via Athena |

## Screenshots

Step-by-step screenshots are in [`images/`](images/) and embedded in the lab guide.

## What you'll learn

- How Lake Formation intercepts Athena queries to enforce column and row-level access
- The difference between Named resource grants and LF-Tag-based (ABAC) grants
- How to audit data access via CloudTrail `GetDataAccess` events

## Prerequisites

- Lab 1 completed (curated Parquet data must exist in your S3 bucket and Glue catalog)
- AWS Console access and your `<USER>` slug from your instructor
