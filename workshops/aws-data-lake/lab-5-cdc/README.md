# Lab 5 — Change Data Capture with AWS DMS

Stream live database changes from PostgreSQL into your data lake using AWS Database Migration Service (DMS).

## Lab guide

| File | Purpose |
|---|---|
| [console-lab-cdc-dms-postgres.md](console-lab-cdc-dms-postgres.md) | Console walkthrough — set up RDS Postgres source, configure DMS endpoints, run a CDC migration task to a Postgres or S3 target |

## RDS source setup

Scripts to load sample data into the PostgreSQL source database.

| File | Purpose |
|---|---|
| [`rds-source/oil_schema.sql`](rds-source/oil_schema.sql) | Creates the `crude_oil_daily` table with CDC-friendly schema |
| [`rds-source/load_oil.sh`](rds-source/load_oil.sh) | Loads the crude oil CSV into the RDS Postgres source |
| [`rds-source/prep_oil_for_postgres.py`](rds-source/prep_oil_for_postgres.py) | Cleans the raw CSV into Postgres-compatible format before loading |


## What you'll learn

- How to enable logical replication on RDS Postgres (`rds_replication` role)
- How DMS captures row-level changes (INSERT / UPDATE / DELETE) via WAL
- The difference between a full-load + CDC task (Postgres target) and a CDC-only task (S3 target)

## Prerequisites

- AWS Console access and your `<USER>` slug from your instructor
- `Crude_Oil_historical_data.csv` — download link provided by your instructor
