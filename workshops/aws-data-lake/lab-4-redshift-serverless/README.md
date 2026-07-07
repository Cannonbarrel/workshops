# Lab 4 — Redshift Serverless and Federated Query

Query live data from Aurora PostgreSQL and your S3 data lake directly inside Redshift — no data movement required.

## Lab guide

| File | Purpose |
|---|---|
| [console-lab-redshift-federated-query.md](console-lab-redshift-federated-query.md) | Console walkthrough — connect to a Redshift workgroup, set up federated query to Aurora, and query S3 via Spectrum |



## What you'll learn

- How to connect to a Redshift Serverless workgroup using the Query Editor
- How federated query lets Redshift read live data from Aurora PostgreSQL without copying it
- How Redshift Spectrum queries Parquet files in S3 via an external schema

## Prerequisites

- AWS Console access and your `<USER>` slug from your instructor
- Lab 1 completed (curated Parquet files must exist in your S3 bucket)
