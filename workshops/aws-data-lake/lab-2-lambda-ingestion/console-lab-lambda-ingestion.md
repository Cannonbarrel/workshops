# AWS Lambda — Event-Driven Ingestion Lab

Builds on the same sandbox as the data-lake lab (same IAM user, same region lock to `us-west-2`, same `quicklabs-<USER>-…` naming convention). This add-on lab covers three ingestion patterns and when to pick each.

```
Use case 1 (field imagery, async fan-in):
  device upload  →  S3 raw bucket  →  S3 event  →  SQS  →  Lambda  →  S3 curated bucket

Use case 2 (batch drop, direct invoke):
  scheduled drop  →  S3 raw bucket  →  S3 event  →  Lambda  →  S3 curated bucket

Use case 3 (Lambda-as-ETL, Redshift + S3 lakehouse, no Glue ETL):
  CSV drop  →  S3 raw bucket  →  Lambda
                                   │
                                   ├── transform to Parquet
                                   ├── write partitioned to S3 curated
                                   ├── register partition in Glue Catalog
                                   └── trigger Redshift COPY
```

Time: ~110 minutes (Use Case 3 adds ~35 min).

---

## Prereqs (already provisioned for you)

Same as the data-lake lab plus:

| Resource | Name |
|---|---|
| Lambda execution role | `quicklabs-<USER>-lambda-role` |

Your IAM user can:

- Create / delete / configure Lambda functions named `quicklabs-<USER>-*`
- Create / delete / configure SQS queues named `quicklabs-<USER>-*` (main + DLQ)
- Wire S3 event notifications on your own buckets to either SQS or Lambda
- Pass the `quicklabs-<USER>-lambda-role` to Lambda (and only Lambda)
- Read Lambda CloudWatch Logs under `/aws/lambda/quicklabs-<USER>-*`
- Create / update / delete Glue partitions on `quicklabs_<USER_>_*` databases (Use Case 3)
- Call the Redshift Data API to verify COPY results (Use Case 3)

The Lambda execution role (`quicklabs-<USER>-lambda-role`) additionally has:
- `glue:CreatePartition` / `BatchCreatePartition` on the student's catalog namespace
- `redshift-data:ExecuteStatement` for triggering COPY
- `redshift-serverless:GetCredentials` for IAM-auth against Redshift Serverless

Sample handler code is in this folder:

- [`image_metadata_handler.py`](lambda-code/image_metadata_handler.py) — SQS-triggered, use case 1
- [`batch_file_handler.py`](lambda-code/batch_file_handler.py) — S3-triggered, use case 2
- [`csv_to_parquet_curated.py`](lambda-code/csv_to_parquet_curated.py) — Lambda-as-ETL, use case 3

---

## Use case 1 — Field imagery: S3 → SQS → Lambda

**When this shape fits:** uploads are bursty and uneven (devices come online, dump a batch, drop off). SQS absorbs the spikes, decouples upload latency from processing latency, and gives you per-message retry + DLQ semantics for free.

### Step 1 — Queues

Create two SQS queues, in this order:

1. **DLQ first** — `quicklabs-<USER>-image-dlq`. Standard queue. Default settings.
2. **Main queue** — `quicklabs-<USER>-image-events`. Standard queue.
   - Visibility timeout: **6× your Lambda timeout** (recommended). E.g. Lambda timeout = 30s → visibility timeout = 180s.
   - Dead-letter queue: select `quicklabs-<USER>-image-dlq`, `maxReceiveCount = 5`.

Then attach an **access policy** on the main queue that lets your raw S3 bucket send to it (SQS console → your queue → Access policy → Edit):

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Service": "s3.amazonaws.com" },
    "Action": "sqs:SendMessage",
    "Resource": "arn:aws:sqs:us-west-2:<ACCOUNT_ID>:quicklabs-<USER>-image-events",
    "Condition": {
      "ArnLike":     { "aws:SourceArn":     "arn:aws:s3:::quicklabs-<USER>-raw" },
      "StringEquals":{ "aws:SourceAccount": "<ACCOUNT_ID>" }
    }
  }]
}
```

> Both `aws:SourceArn` (which bucket) and `aws:SourceAccount` (which AWS account) are required by S3 — without them the bucket-notification config will fail validation.

### Step 2 — S3 event notification

S3 console → `quicklabs-<USER>-raw` → Properties → Event notifications → Create.

- Name: `image-uploads-to-sqs`
- Prefix: `images/`
- Suffix: leave blank (or `.jpg` if you want to filter)
- Events: `s3:ObjectCreated:*`
- Destination: **SQS queue** → `quicklabs-<USER>-image-events`

### Step 3 — Lambda function

Lambda console → Create function → Author from scratch.

- Function name: `quicklabs-<USER>-image-metadata`
- Runtime: Python 3.12
- Architecture: `arm64` (cheaper, faster cold start)
- Execution role: **Use an existing role** → `quicklabs-<USER>-lambda-role`

Then under **Code**:

- Upload `image_metadata_handler.py` (paste contents into the inline editor — Lambda will name it `lambda_function.py`; rename the file or change the handler entry below).
- Handler: `image_metadata_handler.handler`

Under **Configuration**:

- General → Timeout: `30s`, Memory: `256 MB`
- Environment variables:
  - `CURATED_BUCKET = quicklabs-<USER>-curated`
  - `METADATA_PREFIX = image-metadata/`

Under **Triggers** → Add trigger → SQS:

- Queue: `quicklabs-<USER>-image-events`
- Batch size: `10`
- Batch window: `5 seconds`
- **Report batch item failures**: ✅ (this is what makes the `batchItemFailures` return value in the handler actually take effect)

### Step 4 — Smoke test

```bash
USER=alice  # <-- replace
aws s3 cp tank-1.jpg s3://quicklabs-${USER}-raw/images/tank-1.jpg
cat <<EOF > tank-1.json
{"site": "site-42", "device_id": "drone-7", "captured_at": "2025-09-12T14:03:00Z"}
EOF
aws s3 cp tank-1.json s3://quicklabs-${USER}-raw/images/tank-1.json
```

Within ~5–10s:

- CloudWatch Logs → `/aws/lambda/quicklabs-<USER>-image-metadata` shows a `wrote metadata bucket=…` line.
- `aws s3 ls s3://quicklabs-${USER}-curated/image-metadata/images/` shows `tank-1.jpg.json`.

### Step 5 — Force a failure (verify DLQ wiring)

Delete the curated bucket's bucket policy or temporarily set `CURATED_BUCKET` to a bucket the Lambda can't write to. Re-upload an image. Watch:

- The function will retry until `maxReceiveCount` is hit.
- The poisoned message lands in `quicklabs-<USER>-image-dlq` (SQS console → Send and receive messages → Poll).

---

## Use case 2 — Batch drops: S3 → Lambda direct

**When this shape fits:** a known producer (cron job, partner SFTP sync) writes files at a predictable, modest rate. SQS would add a hop with no payoff — Lambda's async invocation already gives you retries and an optional DLQ.

### Step 1 — Lambda function

Same as above but:

- Function name: `quicklabs-<USER>-batch-ingest`
- Handler: `batch_file_handler.handler`
- Code: `batch_file_handler.py`
- Env vars:
  - `CURATED_BUCKET = quicklabs-<USER>-curated`
  - `ALLOWED_PREFIX = drop/`
  - `ALLOWED_SUFFIXES = .csv,.json,.parquet`


### Step 2 — Trigger from S3

Function → Configuration → Triggers → Add trigger → S3:

- Bucket: `quicklabs-<USER>-raw`
- Event types: `PUT`
- Prefix: `drop/`
- Suffix: blank
- ✅ acknowledge the recursive-invocation warning (you're not writing back to the same bucket)

### Step 3 — Smoke test

```bash
USER=alice
aws s3 cp sales-2025-09-12.csv s3://quicklabs-${USER}-raw/drop/sales-2025-09-12.csv
```

Within ~2s:

- CloudWatch Logs → `/aws/lambda/quicklabs-<USER>-batch-ingest` shows `ingested bucket=…`
- `aws s3 ls s3://quicklabs-${USER}-curated/batch/$(date -u +%Y/%m/%d)/` shows the copied file

