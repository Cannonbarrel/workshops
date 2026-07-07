# Lab 2 — Event-driven Ingestion with Lambda

Build event-driven pipelines where S3 uploads automatically trigger Lambda functions to process and transform data.

## Lab guide

| File | Purpose |
|---|---|
| [console-lab-lambda-ingestion.md](console-lab-lambda-ingestion.md) | Step-by-step lab — three use cases, built entirely in the AWS Console |

## Lambda code

Paste these into your Lambda functions when instructed by the lab guide.

| File | Use case |
|---|---|
| [`lambda-code/image_metadata_handler.py`](lambda-code/image_metadata_handler.py) | Use Case 1 — SQS-triggered: extracts metadata from S3 image uploads |
| [`lambda-code/batch_file_handler.py`](lambda-code/batch_file_handler.py) | Use Case 2 — S3 direct: copies batch CSV drops to the curated bucket |
| [`lambda-code/csv_to_parquet_curated.py`](lambda-code/csv_to_parquet_curated.py) | Use Case 3 — Lambda-as-ETL: validates, converts to Parquet, registers partition in Glue |

## What you'll build

```
Use Case 1:  S3 (images/)    → SQS queue → Lambda → S3 curated (metadata JSON)
Use Case 2:  S3 (drop/)      →  S3 event → Lambda → S3 curated (batch files)
Use Case 3:  S3 (oil_drop/)  →  S3 event → Lambda → S3 curated (Parquet) + Glue catalog
```

## Prerequisites

- Lab 1 completed (raw + curated S3 buckets must exist)
- AWS Console access and your `<USER>` slug from your instructor
