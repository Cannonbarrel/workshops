"""
image_metadata_handler — Lambda lab, Use Case 1

Triggered by SQS. Each SQS message wraps an S3 ObjectCreated event from the
raw bucket (S3 → SQS → Lambda fan-in). For each image:

  1. Read the object's metadata (size, content-type, user metadata, S3 tags).
  2. If a sibling `.json` metadata file exists next to the binary, fetch it.
  3. Write a consolidated metadata record to the curated bucket as JSON.
  4. Return per-message failures via `batchItemFailures` so the SQS poller
     only retries the messages that actually failed — the rest get deleted
     from the queue automatically.

Messages that fail repeatedly land in the DLQ configured on the source queue.

ITAR / sensitivity note: nothing in this handler logs the file contents. We
log keys + sizes only. Adjust if your data-classification policy is stricter.

Expected env vars (set when creating the function):
  CURATED_BUCKET   e.g. quicklabs-<user>-curated
  METADATA_PREFIX  default: "image-metadata/"
"""

import json
import logging
import os
import urllib.parse

import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3 = boto3.client("s3")

CURATED_BUCKET = os.environ["CURATED_BUCKET"]
METADATA_PREFIX = os.environ.get("METADATA_PREFIX", "image-metadata/")


def _sibling_metadata_key(image_key: str) -> str:
    base, _ = os.path.splitext(image_key)
    return f"{base}.json"


def _process_record(s3_record: dict) -> None:
    bucket = s3_record["s3"]["bucket"]["name"]
    raw_key = urllib.parse.unquote_plus(s3_record["s3"]["object"]["key"])

    head = s3.head_object(Bucket=bucket, Key=raw_key)
    size = head["ContentLength"]
    content_type = head.get("ContentType", "application/octet-stream")
    user_meta = head.get("Metadata", {})

    sidecar = {}
    sidecar_key = _sibling_metadata_key(raw_key)
    try:
        body = s3.get_object(Bucket=bucket, Key=sidecar_key)["Body"].read()
        sidecar = json.loads(body)
    except ClientError as e:
        if e.response["Error"]["Code"] not in ("NoSuchKey", "404"):
            raise

    record = {
        "source_bucket": bucket,
        "source_key": raw_key,
        "size_bytes": size,
        "content_type": content_type,
        "user_metadata": user_meta,
        "sidecar_metadata": sidecar,
    }
    out_key = f"{METADATA_PREFIX}{raw_key}.json"
    s3.put_object(
        Bucket=CURATED_BUCKET,
        Key=out_key,
        Body=json.dumps(record).encode("utf-8"),
        ContentType="application/json",
    )
    logger.info("wrote metadata bucket=%s key=%s size=%d", CURATED_BUCKET, out_key, size)


def handler(event, context):
    failures = []

    for sqs_msg in event.get("Records", []):
        message_id = sqs_msg["messageId"]
        try:
            body = json.loads(sqs_msg["body"])
            for s3_record in body.get("Records", []):
                _process_record(s3_record)
        except Exception:
            logger.exception("failed messageId=%s", message_id)
            failures.append({"itemIdentifier": message_id})

    return {"batchItemFailures": failures}
