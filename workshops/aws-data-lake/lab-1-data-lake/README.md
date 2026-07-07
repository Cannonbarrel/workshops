# Lab 1 — S3, Glue, and Athena

Build a data lake pipeline that ingests raw CSV data into S3, transforms it to Parquet with a Glue ETL job, and queries it with Athena.

## Lab guides

| Guide | When to use |
|---|---|
| [console-lab-glue-athena.md](console-lab-glue-athena.md) | Follow the AWS Console — recommended for first-timers |
| [cli-lab-glue-athena.md](cli-lab-glue-athena.md) | AWS CLI version — faster if you're comfortable at the terminal |

## Files in this lab

| File | Purpose |
|---|---|
| [`oil_csv_to_parquet.py`](oil_csv_to_parquet.py) | Glue ETL script — paste this into your Glue job. Converts crude oil CSV to partitioned Parquet. |

## What you'll build

```
S3 raw bucket          Glue ETL job             S3 curated bucket
(CSV files)    →    (oil_csv_to_parquet.py)  →  (Parquet, partitioned)
                                                        ↓
                                                  Athena query
```

## Prerequisites

- AWS Console access provided by your instructor
- Region: **us-west-2**
- `Crude_Oil_historical_data.csv` — download link provided by your instructor
- Your `<USER>` slug (everything before `@` in your login)
