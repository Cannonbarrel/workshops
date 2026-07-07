# AWS Data Lake — admin end-to-end walkthrough

Run the **full pipeline once under your admin credentials** before layering on the student IAM policy. This proves the data flow works at all; afterwards you re-run as a sandboxed student and everything you fixed here only fails because of policy.

Pipeline:

```
S3 raw CSV → Glue Crawler → Glue Catalog → Glue ETL job → S3 curated Parquet → Glue Crawler → Athena
```

Total runtime ~10–15 min including crawler + job waits. Cost ~$0.50.

## Prereqs

- AWS CLI configured with **admin** credentials (`aws sts get-caller-identity` works)
- `~/Downloads/Crude_Oil_historical_data.csv` is in place
- You're running this from this folder (`labs/aws-data-lake/`) so `oil_csv_to_parquet.py` is at the relative path

## Step 0 — variables

```bash
USERNAME=demo
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
USERNAME_UNDERSCORED=$(echo "$USERNAME" | tr '-' '_')
export AWS_DEFAULT_REGION=us-west-2
echo "Account: $ACCOUNT_ID, region: $AWS_DEFAULT_REGION, username: $USERNAME"
```

## Step 1 — S3 buckets (raw, curated, scripts, athena-results)

```bash
for zone in raw curated scripts athena-results; do
  aws s3api create-bucket \
    --bucket "quicklabs-${USERNAME}-${zone}" \
    --region us-west-2 \
    --create-bucket-configuration LocationConstraint=us-west-2
  aws s3api put-public-access-block --bucket "quicklabs-${USERNAME}-${zone}" \
    --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
  aws s3api put-bucket-encryption --bucket "quicklabs-${USERNAME}-${zone}" \
    --server-side-encryption-configuration \
    '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
done

aws s3 ls | grep "quicklabs-${USERNAME}-"
```

Expect 4 buckets listed.

## Step 2 — Upload CSV + Glue script

```bash
aws s3 cp /Users/kchandan/Documents/bcr/training/Crude_Oil_historical_data.csv \
  s3://quicklabs-${USERNAME}-raw/oil/Crude_Oil_historical_data.csv

aws s3 cp oil_csv_to_parquet.py \
  s3://quicklabs-${USERNAME}-scripts/oil_csv_to_parquet.py

aws s3 ls s3://quicklabs-${USERNAME}-raw/oil/
aws s3 ls s3://quicklabs-${USERNAME}-scripts/
```

Expect both objects listed.

## Step 3 — Glue service role

```bash
# Trust policy
cat > /tmp/glue-trust.json <<'EOF'
{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"glue.amazonaws.com"},"Action":"sts:AssumeRole"}]}
EOF
aws iam create-role \
  --role-name "quicklabs-${USERNAME}-glue-role" \
  --assume-role-policy-document file:///tmp/glue-trust.json

# Managed policy for Glue baseline (CloudWatch Logs, Glue catalog, etc.)
aws iam attach-role-policy \
  --role-name "quicklabs-${USERNAME}-glue-role" \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSGlueServiceRole

# Inline policy: S3 access to student's buckets
cat > /tmp/glue-s3.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:GetObject","s3:PutObject","s3:DeleteObject","s3:ListBucket","s3:GetBucketLocation"],
    "Resource": [
      "arn:aws:s3:::quicklabs-${USERNAME}-*",
      "arn:aws:s3:::quicklabs-${USERNAME}-*/*"
    ]
  }]
}
EOF
aws iam put-role-policy \
  --role-name "quicklabs-${USERNAME}-glue-role" \
  --policy-name quicklabs-bucket-access \
  --policy-document file:///tmp/glue-s3.json

aws iam get-role --role-name "quicklabs-${USERNAME}-glue-role" --query Role.Arn
```

## Step 4 — Glue database

```bash
aws glue create-database \
  --database-input "Name=quicklabs_${USERNAME_UNDERSCORED}_lake,Description=Demo data lake for ${USERNAME}"

aws glue get-database --name "quicklabs_${USERNAME_UNDERSCORED}_lake"
```

## Step 5 — Crawler over raw zone → discover schema → write to catalog

```bash
aws glue create-crawler \
  --name "quicklabs-${USERNAME}-raw-oil-crawler" \
  --role "quicklabs-${USERNAME}-glue-role" \
  --database-name "quicklabs_${USERNAME_UNDERSCORED}_lake" \
  --table-prefix "raw_" \
  --targets "S3Targets=[{Path=s3://quicklabs-${USERNAME}-raw/oil/}]"

aws glue start-crawler --name "quicklabs-${USERNAME}-raw-oil-crawler"

# Poll until done (typically 1–2 min for one CSV)
while [ "$(aws glue get-crawler --name "quicklabs-${USERNAME}-raw-oil-crawler" --query Crawler.State --output text)" != "READY" ]; do
  echo "  crawler still running..."
  sleep 10
done
echo "Crawler done."

# Verify catalog now has a table
aws glue get-tables --database-name "quicklabs_${USERNAME_UNDERSCORED}_lake" \
  --query "TableList[].{Name:Name,Location:StorageDescriptor.Location,Cols:length(StorageDescriptor.Columns)}" \
  --output table
```

Expect one row: `raw_oil`, location pointing at `s3://.../oil/`, 8 columns (the CSV header).

## Step 6 — Athena workgroup + first query (raw count)

```bash
# Workgroup with results going to the dedicated bucket
cat > /tmp/wg.json <<EOF
{
  "ResultConfiguration": {
    "OutputLocation": "s3://quicklabs-${USERNAME}-athena-results/results/",
    "EncryptionConfiguration": { "EncryptionOption": "SSE_S3" }
  },
  "EnforceWorkGroupConfiguration": true,
  "PublishCloudWatchMetricsEnabled": false
}
EOF
aws athena create-work-group \
  --name "quicklabs-${USERNAME}-wg" \
  --configuration file:///tmp/wg.json

# Run a count query
QUERY_ID=$(aws athena start-query-execution \
  --query-string "SELECT COUNT(*) AS row_count FROM quicklabs_${USERNAME_UNDERSCORED}_lake.raw_oil" \
  --work-group "quicklabs-${USERNAME}-wg" \
  --query QueryExecutionId --output text)

# Poll for finish
while true; do
  STATUS=$(aws athena get-query-execution --query-execution-id "$QUERY_ID" --query QueryExecution.Status.State --output text)
  if [ "$STATUS" = "SUCCEEDED" ]; then break; fi
  if [ "$STATUS" = "FAILED" ] || [ "$STATUS" = "CANCELLED" ]; then
    aws athena get-query-execution --query-execution-id "$QUERY_ID" --query QueryExecution.Status.StateChangeReason
    break
  fi
  sleep 2
done

# Show the row count
aws athena get-query-results --query-execution-id "$QUERY_ID" \
  --query "ResultSet.Rows[].Data[].VarCharValue" --output text
```

Expect `row_count` then `6367` (one less than the 6368 lines in the file because the header row).

## Step 7 — Glue ETL job (CSV → partitioned Parquet)

```bash
aws glue create-job \
  --name "quicklabs-${USERNAME}-oil-etl" \
  --role "arn:aws:iam::${ACCOUNT_ID}:role/quicklabs-${USERNAME}-glue-role" \
  --command "Name=glueetl,ScriptLocation=s3://quicklabs-${USERNAME}-scripts/oil_csv_to_parquet.py,PythonVersion=3" \
  --default-arguments '{"--job-language":"python","--enable-metrics":"true","--enable-continuous-cloudwatch-log":"true"}' \
  --glue-version "4.0" \
  --worker-type "G.1X" \
  --number-of-workers 2 \
  --timeout 30

JOB_RUN_ID=$(aws glue start-job-run \
  --job-name "quicklabs-${USERNAME}-oil-etl" \
  --arguments="--source_path=s3://quicklabs-${USERNAME}-raw/oil/Crude_Oil_historical_data.csv,--target_path=s3://quicklabs-${USERNAME}-curated/oil/" \
  --query JobRunId --output text)
echo "Job run: $JOB_RUN_ID"

# Poll for completion (Glue cold-start is 1–2 min, then ~1 min to run for this dataset)
while true; do
  STATUS=$(aws glue get-job-run --job-name "quicklabs-${USERNAME}-oil-etl" --run-id "$JOB_RUN_ID" --query JobRun.JobRunState --output text)
  echo "  job: $STATUS"
  if [ "$STATUS" = "SUCCEEDED" ]; then break; fi
  if [ "$STATUS" = "FAILED" ] || [ "$STATUS" = "STOPPED" ] || [ "$STATUS" = "TIMEOUT" ]; then
    aws glue get-job-run --job-name "quicklabs-${USERNAME}-oil-etl" --run-id "$JOB_RUN_ID" --query JobRun.ErrorMessage
    break
  fi
  sleep 30
done

# Verify Parquet output (year=YYYY/ partition layout)
aws s3 ls s3://quicklabs-${USERNAME}-curated/oil/ --recursive | head -10
aws s3 ls s3://quicklabs-${USERNAME}-curated/oil/ --recursive | wc -l
```

Expect ~26 partitions (year=2000 through year=2025), each with one Parquet file.

## Step 8 — Crawler over curated → register Parquet table

```bash
aws glue create-crawler \
  --name "quicklabs-${USERNAME}-curated-oil-crawler" \
  --role "quicklabs-${USERNAME}-glue-role" \
  --database-name "quicklabs_${USERNAME_UNDERSCORED}_lake" \
  --table-prefix "curated_" \
  --targets "S3Targets=[{Path=s3://quicklabs-${USERNAME}-curated/oil/}]"

aws glue start-crawler --name "quicklabs-${USERNAME}-curated-oil-crawler"

while [ "$(aws glue get-crawler --name "quicklabs-${USERNAME}-curated-oil-crawler" --query Crawler.State --output text)" != "READY" ]; do
  echo "  crawler still running..."
  sleep 10
done

aws glue get-tables --database-name "quicklabs_${USERNAME_UNDERSCORED}_lake" \
  --query "TableList[].{Name:Name,Format:StorageDescriptor.InputFormat,Partitions:length(PartitionKeys)}" \
  --output table
```

Expect both `raw_oil` and `curated_oil`. The curated one shows ParquetInputFormat and 1 partition key (`year`).

## Step 9 — Athena query against the Parquet table — the loop closes

```bash
QUERY_ID=$(aws athena start-query-execution \
  --query-string "SELECT year, COUNT(*) AS days, ROUND(AVG(close), 2) AS avg_close, ROUND(MAX(high), 2) AS yr_high, ROUND(MIN(low), 2) AS yr_low FROM quicklabs_${USERNAME_UNDERSCORED}_lake.curated_oil GROUP BY year ORDER BY year" \
  --work-group "quicklabs-${USERNAME}-wg" \
  --query QueryExecutionId --output text)

while true; do
  STATUS=$(aws athena get-query-execution --query-execution-id "$QUERY_ID" --query QueryExecution.Status.State --output text)
  if [ "$STATUS" = "SUCCEEDED" ]; then break; fi
  if [ "$STATUS" = "FAILED" ] || [ "$STATUS" = "CANCELLED" ]; then
    aws athena get-query-execution --query-execution-id "$QUERY_ID" --query QueryExecution.Status.StateChangeReason
    break
  fi
  sleep 2
done

aws athena get-query-results --query-execution-id "$QUERY_ID" \
  --query "ResultSet.Rows[].Data[].VarCharValue" --output table
```

Expect a 26-row result, oil prices per year from 2000 to 2025.

You've now done the full S3 → Crawler → Catalog → ETL → Parquet → Athena loop. Everything below this line is optional / cleanup.

## Step 10 — Glue Interactive Session (notebook), optional

For interactive PySpark development against Glue (Jupyter-style), you can either:

**(a) Glue Studio Notebook UI** — easiest. Console → Glue Studio → Notebooks → Create. Pick Glue 4.0+, role `quicklabs-${USERNAME}-glue-role`, name it `quicklabs-${USERNAME}-nb`. Notebook opens in browser, attached to a live Glue session.

**(b) CLI session + local Jupyter** — for instructors who want to demo programmatically:

```bash
# Start a session
SESSION_ID="quicklabs-${USERNAME}-test-session-1"
aws glue create-session \
  --id "$SESSION_ID" \
  --role "arn:aws:iam::${ACCOUNT_ID}:role/quicklabs-${USERNAME}-glue-role" \
  --command Name=glueetl,PythonVersion=3 \
  --max-capacity 2 \
  --idle-timeout 30 \
  --glue-version "4.0"

# Wait for READY
while [ "$(aws glue get-session --id "$SESSION_ID" --query Session.Status --output text)" != "READY" ]; do
  echo "  session warming up..."
  sleep 15
done

# Run a statement
STATEMENT_ID=$(aws glue run-statement --session-id "$SESSION_ID" \
  --code "df = spark.read.parquet('s3://quicklabs-${USERNAME}-curated/oil/'); df.show(5); print('rows:', df.count())" \
  --query Id --output text)

# Wait + fetch
while [ "$(aws glue get-statement --session-id "$SESSION_ID" --id "$STATEMENT_ID" --query Statement.State --output text)" != "AVAILABLE" ]; do
  sleep 5
done
aws glue get-statement --session-id "$SESSION_ID" --id "$STATEMENT_ID" --query Statement.Output

# Tear down the session
aws glue delete-session --id "$SESSION_ID"
```

Students can use Glue Studio notebooks: the `GlueOwnSessions` statement in `student-user-policy.json` allows `glue:*` on `session/quicklabs-${USERNAME}-*`. The student must **explicitly name** their notebook with the `quicklabs-<USER>-` prefix (the notebook name becomes the session name) — Glue Studio's auto-generated session names won't match the policy.

## Cleanup

```bash
# Glue: jobs, crawlers, database (must be in this order)
aws glue delete-job     --job-name     "quicklabs-${USERNAME}-oil-etl"
aws glue delete-crawler --name         "quicklabs-${USERNAME}-raw-oil-crawler"
aws glue delete-crawler --name         "quicklabs-${USERNAME}-curated-oil-crawler"
aws glue delete-database --name        "quicklabs_${USERNAME_UNDERSCORED}_lake"

# Athena workgroup
aws athena delete-work-group --work-group "quicklabs-${USERNAME}-wg" --recursive-delete-option

# S3 buckets (empty + delete)
for zone in raw curated scripts athena-results; do
  aws s3 rm "s3://quicklabs-${USERNAME}-${zone}" --recursive
  aws s3api delete-bucket --bucket "quicklabs-${USERNAME}-${zone}"
done

# IAM Glue role
aws iam delete-role-policy --role-name "quicklabs-${USERNAME}-glue-role" --policy-name quicklabs-bucket-access
aws iam detach-role-policy --role-name "quicklabs-${USERNAME}-glue-role" --policy-arn arn:aws:iam::aws:policy/service-role/AWSGlueServiceRole
aws iam delete-role        --role-name "quicklabs-${USERNAME}-glue-role"
```

## What this proves

- The Glue role can read from `quicklabs-${USERNAME}-raw`, write to `quicklabs-${USERNAME}-curated`, and write to the catalog ✅
- The Glue ETL job script works against the real CSV ✅
- Athena can query both raw CSV and curated Parquet through the workgroup ✅
- The whole pipeline is sound — any failure when re-running this as a sandboxed student is a **policy issue**, not a pipeline issue

## Next: re-run as a sandboxed student

Now apply the IAM policy from `README.md` (the "One-shot setup script" block). Sign in as `quicklabs-demo` in an incognito window and **redo every step above through the AWS console**. Anything that should work but doesn't = a gap in `student-user-policy.json` to fix.
