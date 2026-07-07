"""
batch_file_handler — Lambda lab, Use Case 2

Triggered directly by S3 ObjectCreated events on the raw bucket (no SQS in the
middle — for batch drops where the file rate is low enough that direct invoke
is fine and the extra hop isn't worth it).

For each new object:
  1. Validate the key is in the expected drop prefix (default: "drop/").
  2. Validate content type (default: csv/json/parquet — extend per your use case).
  3. Copy the object into the curated bucket under "batch/<yyyy>/<mm>/<dd>/".
  4. Tag the source object as processed so re-runs are idempotent.

If anything fails the handler raises — Lambda will retry per its async-invocation
retry policy (2 retries by default). After retries exhaust, the failed event is
sent to the Lambda async-DLQ (configure on the function's "destinations" tab).

Expected env vars:
  CURATED_BUCKET     e.g. quicklabs-<user>-curated
  ALLOWED_PREFIX     default: "drop/"
  ALLOWED_SUFFIXES   default: ".csv,.json,.parquet"  (comma-separated)
"""

import logging
import os
import urllib.parse
from datetime import datetime, timezone

import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3 = boto3.client("s3")

CURATED_BUCKET = os.environ["CURATED_BUCKET"]
ALLOWED_PREFIX = os.environ.get("ALLOWED_PREFIX", "drop/")
ALLOWED_SUFFIXES = tuple(
    s.strip().lower() for s in os.environ.get("ALLOWED_SUFFIXES", ".csv,.json,.parquet").split(",")
)


def _curated_key(raw_key: str) -> str:
    now = datetime.now(timezone.utc)
    base = os.path.basename(raw_key)
    return f"batch/{now:%Y/%m/%d}/{base}"


def _process_record(s3_record: dict) -> None:
    bucket = s3_record["s3"]["bucket"]["name"]
    raw_key = urllib.parse.unquote_plus(s3_record["s3"]["object"]["key"])

    if not raw_key.startswith(ALLOWED_PREFIX):
        logger.warning("skip prefix bucket=%s key=%s", bucket, raw_key)
        return
    if not raw_key.lower().endswith(ALLOWED_SUFFIXES):
        logger.warning("skip suffix bucket=%s key=%s", bucket, raw_key)
        return

    target_key = _curated_key(raw_key)
    s3.copy_object(
        Bucket=CURATED_BUCKET,
        Key=target_key,
        CopySource={"Bucket": bucket, "Key": raw_key},
        MetadataDirective="COPY",
    )
    s3.put_object_tagging(
        Bucket=bucket,
        Key=raw_key,
        Tagging={"TagSet": [{"Key": "ingest-status", "Value": "processed"}]},
    )
    logger.info("ingested bucket=%s key=%s -> %s/%s", bucket, raw_key, CURATED_BUCKET, target_key)


def handler(event, context):
    for record in event.get("Records", []):
        _process_record(record)
    return {"processed": len(event.get("Records", []))}
