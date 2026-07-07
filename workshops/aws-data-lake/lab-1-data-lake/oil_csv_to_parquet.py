"""
AWS Glue 4.0 / 5.0 PySpark job: clean Crude Oil historical CSV → partitioned Parquet.

Source CSV (Kaggle yfinance dump):
    Date, Open, High, Low, Close, Volume, ticker, name
    e.g. "2000-08-23 00:00:00-04:00",31.95,32.80,31.95,32.05,79385,"CL=F","Crude Oil Futures (CL=F)"

What this job does:
    - Reads the CSV with an explicit schema (no Glue inference)
    - Parses the timezone-aware Date string into a proper timestamp + date
    - Casts Open/High/Low/Close to double rounded to 4 decimals (float-noise from source)
    - Casts Volume to long; drops rows where Volume or Close is null
    - Drops the constant `name` column (always "Crude Oil Futures (CL=F)")
    - Adds derived columns: year, month, daily_range, daily_change_pct
    - Writes Parquet partitioned by year, sorted by date within each partition

Job parameters (set in the Glue job config, or pass with --source_path etc.):
    --source_path   s3://quicklabs-<you>-raw/oil/Crude_Oil_historical_data.csv
    --target_path   s3://quicklabs-<you>-curated/oil/

Run from console:
    Glue → Jobs → Add job → Spark, Python 3, Glue 4.0+
    IAM role: quicklabs-<you>-glue-role
    Script location: paste this file or upload to s3://quicklabs-<you>-scripts/
    Job parameters: --source_path=..., --target_path=...
    Worker type: G.1X, 2 workers (default; this dataset is tiny)

Catalog the output afterwards (one-time, in Athena):
    CREATE EXTERNAL TABLE quicklabs_<you>_oil_lake.crude_oil_daily (
      date date, ts timestamp,
      open double, high double, low double, close double,
      volume bigint, ticker string,
      month int, daily_range double, daily_change_pct double
    )
    PARTITIONED BY (year int)
    STORED AS PARQUET
    LOCATION 's3://quicklabs-<you>-curated/oil/';
    MSCK REPAIR TABLE quicklabs_<you>_oil_lake.crude_oil_daily;

Or point a Glue crawler at the target_path and let it infer.
"""

import sys

from awsglue.context import GlueContext
from awsglue.job import Job
from awsglue.utils import getResolvedOptions
from pyspark.context import SparkContext
from pyspark.sql import functions as F
from pyspark.sql.types import (
    DoubleType,
    LongType,
    StringType,
    StructField,
    StructType,
)

# -----------------------------------------------------------------------------
# Glue boilerplate
# -----------------------------------------------------------------------------

args = getResolvedOptions(
    sys.argv,
    ["JOB_NAME", "source_path", "target_path"],
)

sc = SparkContext()
glue_ctx = GlueContext(sc)
spark = glue_ctx.spark_session
job = Job(glue_ctx)
job.init(args["JOB_NAME"], args)

# Tighter Parquet output: snappy compression, no _SUCCESS file noise
spark.conf.set("spark.sql.sources.partitionOverwriteMode", "dynamic")
spark.conf.set("spark.sql.parquet.compression.codec", "snappy")
spark.conf.set("mapreduce.fileoutputcommitter.marksuccessfuljobs", "false")

# -----------------------------------------------------------------------------
# Schema — explicit, no inference
# -----------------------------------------------------------------------------

raw_schema = StructType(
    [
        StructField("Date", StringType(), nullable=False),
        StructField("Open", DoubleType(), nullable=True),
        StructField("High", DoubleType(), nullable=True),
        StructField("Low", DoubleType(), nullable=True),
        StructField("Close", DoubleType(), nullable=True),
        StructField("Volume", LongType(), nullable=True),
        StructField("ticker", StringType(), nullable=True),
        StructField("name", StringType(), nullable=True),
    ]
)

# -----------------------------------------------------------------------------
# Read
# -----------------------------------------------------------------------------

raw = (
    spark.read
    .option("header", "true")
    .option("quote", '"')
    .option("escape", '"')
    .schema(raw_schema)
    .csv(args["source_path"])
)

input_count = raw.count()
print(f"[oil_csv_to_parquet] read {input_count} rows from {args['source_path']}")

# -----------------------------------------------------------------------------
# Clean + transform
# -----------------------------------------------------------------------------

# Date column looks like "2000-08-23 00:00:00-04:00" — Spark can parse it with
# the right format string. Project both a timestamp (`ts`) and a date (`date`)
# so downstream consumers don't have to think about tz.
ts_format = "yyyy-MM-dd HH:mm:ssXXX"

# Spark is case-insensitive by default, so `Open` and `open` collide. Do the
# rename in a single select() — input schema (uppercase) and output schema
# (lowercase) are separate, so there's no collision and no follow-up drop().
cleaned = (
    raw
    .withColumn("ts", F.to_timestamp("Date", ts_format))
    .select(
        F.to_date("ts").alias("date"),
        F.col("ts"),
        F.year(F.to_date("ts")).alias("year"),
        F.month(F.to_date("ts")).alias("month"),
        F.round(F.col("Open"), 4).alias("open"),
        F.round(F.col("High"), 4).alias("high"),
        F.round(F.col("Low"), 4).alias("low"),
        F.round(F.col("Close"), 4).alias("close"),
        F.col("Volume").alias("volume"),
        F.col("ticker"),
    )
    .withColumn("daily_range", F.round(F.col("high") - F.col("low"), 4))
    .withColumn(
        "daily_change_pct",
        F.when(F.col("open") != 0, F.round((F.col("close") - F.col("open")) / F.col("open") * 100, 4)),
    )
    .dropna(subset=["date", "close", "volume"])
    .repartition("year")
    .sortWithinPartitions("date")
)

output_count = cleaned.count()
dropped = input_count - output_count
print(f"[oil_csv_to_parquet] cleaned: {output_count} rows ({dropped} dropped)")

# Schema sanity-check (visible in the job log)
cleaned.printSchema()

# -----------------------------------------------------------------------------
# Write
# -----------------------------------------------------------------------------

(
    cleaned
    .write
    .mode("overwrite")
    .partitionBy("year")
    .parquet(args["target_path"])
)

partition_count = cleaned.select("year").distinct().count()
print(
    f"[oil_csv_to_parquet] wrote {output_count} rows across {partition_count} year partitions to {args['target_path']}"
)

job.commit()
