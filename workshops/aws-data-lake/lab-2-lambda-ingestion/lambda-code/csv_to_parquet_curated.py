"""
csv_to_parquet_curated — Lambda-as-ETL handler (Use Case 3)

Replaces what AWS Glue ETL + Glue Crawlers would do, for organizations whose
data platform stands on Redshift + S3 but cannot adopt Glue ETL.

Triggered by S3 ObjectCreated on the raw bucket. Per object:

  1. Read the source file (CSV).
  2. Validate against an explicit, deploy-time-declared schema. No inference.
  3. Transform to Parquet (Snappy, columnar) — Redshift-COPY-friendly,
     Spectrum-friendly, Athena-friendly.
  4. Partition by `trade_date` and write to:
        s3://<curated>/<table>/year=YYYY/month=MM/day=DD/<key>.parquet
  5. Register each new partition with the Glue Data Catalog
     (BatchCreatePartition) — the catalog stays passive: we don't run Glue
     ETL or crawlers, we just keep the metadata up to date so Spectrum/Athena
     can address the partitions.
  6. (Optional) Trigger Redshift COPY via redshift-data API, gated on
     REDSHIFT_WORKGROUP being present in the env. When unset, the function
     is a pure S3 ETL.
  7. Tag the source object `ingest-status=processed` for idempotency.

Required Lambda Layer:
  - AWS-managed "AWS SDK for pandas" (formerly AWS Data Wrangler) layer.
    Provides pandas + pyarrow without bundling.
    Pick the latest version ARN for your region from:
    https://aws-sdk-pandas.readthedocs.io/en/stable/install.html

Environment variables:
  CURATED_BUCKET            quicklabs-<u>-curated
  GLUE_DATABASE             quicklabs_<u>_lake
  TARGET_TABLE              oil_curated
  REDSHIFT_WORKGROUP        (optional) Redshift Serverless workgroup name
  REDSHIFT_DATABASE         (optional) target Redshift database
  REDSHIFT_COPY_ROLE_ARN    (optional) IAM role Redshift assumes to read S3
"""

import json
import logging
import os
import urllib.parse
from datetime import datetime
from io import BytesIO

import boto3
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3 = boto3.client("s3")
glue = boto3.client("glue")
redshift_data = boto3.client("redshift-data")

CURATED_BUCKET = os.environ["CURATED_BUCKET"]
GLUE_DATABASE = os.environ["GLUE_DATABASE"]
TARGET_TABLE = os.environ["TARGET_TABLE"]
REDSHIFT_WORKGROUP = os.environ.get("REDSHIFT_WORKGROUP", "")
REDSHIFT_DATABASE = os.environ.get("REDSHIFT_DATABASE", "")
REDSHIFT_COPY_ROLE_ARN = os.environ.get("REDSHIFT_COPY_ROLE_ARN", "")

# Declarative schema. The whole point of the no-Glue approach is that schema
# lives in code, not in a crawler's inference. Edit here when source changes.
EXPECTED_COLUMNS = ["trade_date", "symbol", "region", "price", "volume"]


def _already_processed(bucket: str, key: str) -> bool:
    tags = s3.get_object_tagging(Bucket=bucket, Key=key).get("TagSet", [])
    return any(t["Key"] == "ingest-status" and t["Value"] == "processed" for t in tags)


def _read_and_validate(bucket: str, key: str) -> pd.DataFrame:
    obj = s3.get_object(Bucket=bucket, Key=key)
    df = pd.read_csv(obj["Body"])
    missing = set(EXPECTED_COLUMNS) - set(df.columns)
    if missing:
        raise ValueError(f"schema mismatch in s3://{bucket}/{key}: missing columns {sorted(missing)}")
    df["trade_date"] = pd.to_datetime(df["trade_date"]).dt.date
    df["price"] = df["price"].astype("float64")
    df["volume"] = df["volume"].astype("int64")
    return df[EXPECTED_COLUMNS]


def _partition_prefix(d) -> str:
    return f"year={d.year}/month={d.month:02d}/day={d.day:02d}"


def _write_parquet(df: pd.DataFrame, bucket: str, key: str) -> None:
    table = pa.Table.from_pandas(df, preserve_index=False)
    buf = BytesIO()
    pq.write_table(table, buf, compression="snappy")
    s3.put_object(
        Bucket=bucket,
        Key=key,
        Body=buf.getvalue(),
        ContentType="application/octet-stream",
    )


def _register_partition(date, s3_location: str) -> None:
    """Register a Hive-style partition in the Glue Data Catalog.

    We do this manually because the org doesn't run Glue Crawlers. Spectrum
    and Athena both need the partition entry to address files at this path.
    Idempotent — AlreadyExistsException is swallowed.
    """
    values = [str(date.year), f"{date.month:02d}", f"{date.day:02d}"]
    try:
        glue.create_partition(
            DatabaseName=GLUE_DATABASE,
            TableName=TARGET_TABLE,
            PartitionInput={
                "Values": values,
                "StorageDescriptor": {
                    "Location": s3_location,
                    "InputFormat": "org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat",
                    "OutputFormat": "org.apache.hadoop.hive.ql.io.parquet.MapredParquetOutputFormat",
                    "SerdeInfo": {
                        "SerializationLibrary": "org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe",
                    },
                },
            },
        )
        logger.info("registered glue partition values=%s loc=%s", values, s3_location)
    except glue.exceptions.AlreadyExistsException:
        logger.info("glue partition already exists, skipping values=%s", values)


def _trigger_redshift_copy(s3_uri: str) -> None:
    """COPY the just-written Parquet file into the Redshift internal table.

    Only fires when REDSHIFT_WORKGROUP is set; otherwise the function is a
    pure S3 ETL and Redshift Spectrum can address the new partition via the
    Glue catalog entry we just registered.
    """
    if not REDSHIFT_WORKGROUP:
        return
    if not REDSHIFT_COPY_ROLE_ARN:
        logger.warning("REDSHIFT_WORKGROUP set but REDSHIFT_COPY_ROLE_ARN missing; skipping COPY")
        return
    sql = (
        f"COPY {TARGET_TABLE} "
        f"FROM '{s3_uri}' "
        f"IAM_ROLE '{REDSHIFT_COPY_ROLE_ARN}' "
        f"FORMAT AS PARQUET;"
    )
    resp = redshift_data.execute_statement(
        WorkgroupName=REDSHIFT_WORKGROUP,
        Database=REDSHIFT_DATABASE,
        Sql=sql,
    )
    logger.info("submitted redshift COPY id=%s sql=%s", resp["Id"], sql)


def _process_record(record: dict) -> None:
    bucket = record["s3"]["bucket"]["name"]
    key = urllib.parse.unquote_plus(record["s3"]["object"]["key"])

    if _already_processed(bucket, key):
        logger.info("skip already-processed bucket=%s key=%s", bucket, key)
        return

    df = _read_and_validate(bucket, key)
    base = os.path.basename(key).rsplit(".", 1)[0]

    for trade_date, group in df.groupby("trade_date", sort=True):
        partition = _partition_prefix(trade_date)
        target_key = f"{TARGET_TABLE}/{partition}/{base}.parquet"
        partition_uri = f"s3://{CURATED_BUCKET}/{TARGET_TABLE}/{partition}/"
        object_uri = f"s3://{CURATED_BUCKET}/{target_key}"

        _write_parquet(group, CURATED_BUCKET, target_key)
        _register_partition(trade_date, partition_uri)
        _trigger_redshift_copy(object_uri)

    s3.put_object_tagging(
        Bucket=bucket,
        Key=key,
        Tagging={"TagSet": [{"Key": "ingest-status", "Value": "processed"}]},
    )
    logger.info("done bucket=%s key=%s partitions=%d", bucket, key, df["trade_date"].nunique())


def handler(event, context):
    for record in event.get("Records", []):
        _process_record(record)
    return {"processed_files": len(event.get("Records", []))}
