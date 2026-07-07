# Student Lab 1 — Build an AWS Data Lake with S3, Glue & Athena

End-to-end student lab: create S3 buckets, catalog raw CSV with a Glue Crawler, run a PySpark ETL job that converts CSV to partitioned Parquet, catalog the output, and compare Athena query cost before and after — with a self-serve assignment at the end.

> Full web version with video: [beCloudReady — AWS Data Lake with Glue & Athena](https://www.becloudready.com/learn/aws-data-lake-glue-athena)

**Time:** ~90 minutes, including the assignment.

```
S3 (raw CSV) → Glue Crawler → Glue Data Catalog → Athena (SQL)
                                      ↓
                              Glue ETL Job (Spark)
                                      ↓
                  S3 (curated Parquet) → Glue Crawler → Athena (SQL)
```

![Architecture diagram](https://pub-5c24f672454946bb951bf35f09c3964e.r2.dev/learn/aws-data-engineer/01-s3-glue-pipeline-flow.png)

---

## What your instructor gave you

| | Value |
|---|---|
| Glue service role | `quicklabs-<USER>-glue-role` (already exists — you'll select it, not create it) |
| Athena workgroup | `quicklabs-<USER>-wg` (already exists — you'll switch to it, not create it) |
| Dataset + script | `Crude_Oil_historical_data.csv` and `oil_csv_to_parquet.py`, sent to you separately — download both before Part 3 |

Throughout this lab, `<USER>` means your **slug** — everything in your username **before** the `@`. If your login is `suresh-raina@quicklabs.internal`, your `<USER>` is `suresh-raina`.

> **Important:** Every resource you create must be named `quicklabs-<USER>-...` (or `quicklabs_<USER>_...` for Glue databases, which can't contain hyphens). Your IAM policy only allows actions on resources matching your own namespace — a typo in the slug will produce `not authorized to perform ... because no identity-based policy allows the action`.

## Resources you'll create yourself

| Resource | Name you'll give it |
|---|---|
| Raw bucket | `quicklabs-<USER>-raw` |
| Curated bucket | `quicklabs-<USER>-curated` |
| Scripts bucket | `quicklabs-<USER>-scripts` |
| Glue database | `quicklabs_<USER>_lake` (note underscores) |
| Raw crawler | `quicklabs-<USER>-raw-crawler` |
| ETL job | `quicklabs-<USER>-oil-etl` |
| Curated crawler | `quicklabs-<USER>-curated-crawler` |

---

## Part 1 — Create your S3 buckets

You need three buckets: one for raw data, one for the transformed (curated) output, and one to hold the ETL script.

### 1.1 Create the raw bucket

1. Select S3 service from the AWS Console.

![Select S3 service](https://pub-5c24f672454946bb951bf35f09c3964e.r2.dev/learn/aws-data-engineer/01-03-s3-service-selection.png)

2. **S3 → Create bucket.** Bucket name: `quicklabs-<USER>-raw` (must match your namespace exactly).

![Name the Bucket](https://pub-5c24f672454946bb951bf35f09c3964e.r2.dev/learn/aws-data-engineer/01-04-s3-bucket-name.png)

Leave **Block all public access** checked and default encryption (SSE-S3) on — your policy requires this. Glue and Athena access the bucket through IAM, not public URLs. Keep versioning disabled — this lab doesn't use cross-region replication or S3 lifecycle features.

![Block Public Access](https://pub-5c24f672454946bb951bf35f09c3964e.r2.dev/learn/aws-data-engineer/01-05-s3-acl-policy.png)

Keep the default option for server-side encryption.

![Server Side Encryption](https://pub-5c24f672454946bb951bf35f09c3964e.r2.dev/learn/aws-data-engineer/01-06-s3-server-side-encryption.png)

### 1.2 Repeat for curated and scripts

Same steps, names `quicklabs-<USER>-curated` and `quicklabs-<USER>-scripts`.

![Three buckets listed in S3 console](https://pub-5c24f672454946bb951bf35f09c3964e.r2.dev/learn/aws-data-engineer/02-02-three-buckets-listed.png)

> If bucket creation fails with `AccessDenied`, double-check the name starts with exactly `quicklabs-<USER>-` — typos here are the #1 source of denied errors in this lab.

---

## Part 2 — Upload your data and script

### 2.1 Download the files

Download `Crude_Oil_historical_data.csv` and `oil_csv_to_parquet.py` from the link/attachment your instructor sent.

### 2.2 Upload the CSV to your raw bucket

1. **S3 → `quicklabs-<USER>-raw` → Create folder** → name it `oil`.

![Create Folder in S3 Bucket](https://pub-5c24f672454946bb951bf35f09c3964e.r2.dev/learn/aws-data-engineer/03-01-s3-create-folder.png)

2. Open the `oil/` folder → **Upload** → add `Crude_Oil_historical_data.csv` → **Upload**.

![Uploading CSV into the raw/oil/ folder](https://pub-5c24f672454946bb951bf35f09c3964e.r2.dev/learn/aws-data-engineer/03-02-upload-csv.png)

### 2.3 Upload the script to your scripts bucket

**S3 → `quicklabs-<USER>-scripts` → Upload** → add `oil_csv_to_parquet.py` → **Upload**. (No subfolder needed here.)

![Uploading the ETL script into the scripts bucket](https://pub-5c24f672454946bb951bf35f09c3964e.r2.dev/learn/aws-data-engineer/03-02-upload-script.png)

Confirm both objects landed:
- `s3://quicklabs-<USER>-raw/oil/Crude_Oil_historical_data.csv`
- `s3://quicklabs-<USER>-scripts/oil_csv_to_parquet.py`

---

## Part 3 — Create your Glue database

**AWS Glue → Data Catalog → Databases → Add database.**

- Select the AWS Glue service.

![Select Glue Service](https://pub-5c24f672454946bb951bf35f09c3964e.r2.dev/learn/aws-data-engineer/04-01-aws-glue-service.png)

- Name: `quicklabs_<USER>_lake` (underscores, not hyphens — Glue databases can't contain hyphens)
- Location: leave blank
- **Create database.**

![Creating a Glue database](https://pub-5c24f672454946bb951bf35f09c3964e.r2.dev/learn/aws-data-engineer/04-02-create-glue-database.png)

> **Ask AI — what a Glue database actually is**
> ```
> In AWS Glue, what is a "database" really, given that it doesn't store any
> rows itself? Explain how it relates to the Glue Data Catalog and to the
> tables a crawler will register inside it, in plain English for someone
> who has only used traditional relational databases before.
> ```

---

## Part 4 — Create and run the raw crawler

A Glue Crawler scans a folder in S3, infers a schema, and registers a table in the Glue Data Catalog. The underlying file never moves — the crawler only writes metadata.

### 4.1 Create the crawler

**Glue → Crawlers → Create crawler.**

1. Name: `quicklabs-<USER>-raw-crawler`
2. Data source: **Add a data source** → S3 → browse to `s3://quicklabs-<USER>-raw/oil/`
3. IAM role: **Choose an existing IAM role** → `quicklabs-<USER>-glue-role`
4. Target database: `quicklabs_<USER>_lake`
5. Table prefix: `raw_`
6. Frequency: **On demand**
7. Review and **Create crawler**

![Crawler creation wizard - source step](https://pub-5c24f672454946bb951bf35f09c3964e.r2.dev/learn/aws-data-engineer/05-01-crawler-wizard-source.png)
![Crawler creation wizard - data source step](https://pub-5c24f672454946bb951bf35f09c3964e.r2.dev/learn/aws-data-engineer/05-02-crawler-wizard-source.png)
![Crawler creation wizard - IAM role step](https://pub-5c24f672454946bb951bf35f09c3964e.r2.dev/learn/aws-data-engineer/05-03-crawler-wizard-role.png)
![Crawler creation wizard - choose Glue DB](https://pub-5c24f672454946bb951bf35f09c3964e.r2.dev/learn/aws-data-engineer/05-04-crawler-wizard-db.png)

### 4.2 Run it

Select your new crawler → **Run**. Watch the status: `Starting` → `Running` → `Stopping` → `Ready` (~1-2 minutes).

![Crawler running](https://pub-5c24f672454946bb951bf35f09c3964e.r2.dev/learn/aws-data-engineer/05-05-crawler-running.png)

### 4.3 Confirm the table appeared

**Glue → Databases → `quicklabs_<USER>_lake` → Tables** → you should see a new table `raw_oil`.

![New raw_oil table in catalog](https://pub-5c24f672454946bb951bf35f09c3964e.r2.dev/learn/aws-data-engineer/05-06-raw-oil-table.png)

Click into `raw_oil` and check the schema — 8 columns: `date, open, high, low, close, volume, ticker, name`.

![raw_oil table schema](https://pub-5c24f672454946bb951bf35f09c3964e.r2.dev/learn/aws-data-engineer/05-07-raw-oil-schema.png)

> **Ask AI — what just happened**
> ```
> I just ran an AWS Glue Crawler against a CSV file in S3 and it created a
> table called raw_oil in the Glue Data Catalog with 8 inferred columns.
> Explain in simple terms what the crawler actually did under the hood, why
> this step doesn't move or copy my data, and what the Glue Data Catalog
> conceptually is (e.g. how it relates to a "table" if there's no database
> engine actually storing rows).
> ```

---

## Part 5 — Query the raw table with Athena

### 5.1 Switch to your workgroup

**Athena → Editor.** Top-left workgroup dropdown → switch to `quicklabs-<USER>-wg` (the default `primary` workgroup is denied for you). Pick `quicklabs_<USER>_lake` from the database dropdown on the left.

![Athena editor with workgroup and database selected](https://pub-5c24f672454946bb951bf35f09c3964e.r2.dev/learn/aws-data-engineer/06-01-athena-editor.png)

### 5.2 Run your first query

```sql
SELECT COUNT(*) FROM raw_oil;
```

Expect **6367**.

![Athena query result - row count](https://pub-5c24f672454946bb951bf35f09c3964e.r2.dev/learn/aws-data-engineer/06-02-athena-count-query.png)

### 5.3 Explore a bit more

```sql
SELECT * FROM raw_oil LIMIT 10;

SELECT MIN(date), MAX(date) FROM raw_oil;
```

Note the **"Data scanned"** stat under the results — that's what you pay for with Athena. Keep this number in mind; you'll compare it after the ETL step.

![Athena data scanned stat](https://pub-5c24f672454946bb951bf35f09c3964e.r2.dev/learn/aws-data-engineer/06-04-athena-data-scanned.png)

> **Ask AI — Athena pricing model**
> ```
> Explain how Amazon Athena pricing works (pay-per-query, based on data
> scanned). Why does file format (CSV vs Parquet) and partitioning affect
> the cost and speed of a query? Keep it to a short, concrete explanation
> with a simple example using dollar amounts per TB scanned.
> ```

---

## Part 6 — Create and run the ETL job

CSV is fine for small, ad-hoc lookups, but slow and expensive to scan at scale because every query reads every byte of every row. The ETL job converts the same data into **Parquet** — a columnar, compressed format — and partitions it by year, so Athena can skip whole chunks of data it doesn't need.

### 6.1 Create the job

**Glue → ETL jobs → Create job → Spark script editor.**

1. Choose **Upload and edit an existing script** → upload `oil_csv_to_parquet.py` (or browse to it in `s3://quicklabs-<USER>-scripts/`).
2. Name the job `quicklabs-<USER>-oil-etl`.

![Glue ETL job creation - script upload](https://pub-5c24f672454946bb951bf35f09c3964e.r2.dev/learn/aws-data-engineer/07-01-etl-job-create-script.png)

### 6.2 Configure the job details

In the **Job details** tab:

| Setting | Value |
|---|---|
| IAM role | `quicklabs-<USER>-glue-role` |
| Glue version | **4.0** |
| Worker type | **G.1X** |
| Number of workers | **2** |
| Job parameter `--source_path` | `s3://quicklabs-<USER>-raw/oil/Crude_Oil_historical_data.csv` |
| Job parameter `--target_path` | `s3://quicklabs-<USER>-curated/oil/` |

Add the two job parameters under **Advanced properties → Job parameters**.

![Glue ETL job details - role, version, workers, parameters](https://pub-5c24f672454946bb951bf35f09c3964e.r2.dev/learn/aws-data-engineer/07-02-etl-job-details.png)

**Save.**

### 6.3 Run it

Click **Run**. Switch to the **Runs** tab and watch the status. Cold start takes ~1-2 minutes, then the job itself runs about a minute.

![Glue ETL job runs tab - succeeded](https://pub-5c24f672454946bb951bf35f09c3964e.r2.dev/learn/aws-data-engineer/07-03-etl-job-succeeded.png)

When it shows `Succeeded`, open the **Output logs** (CloudWatch link) — you'll see the script's print statements reporting rows in / rows out.

![CloudWatch logs for ETL job](https://pub-5c24f672454946bb951bf35f09c3964e.r2.dev/learn/aws-data-engineer/07-04-etl-job-logs.png)

### 6.4 Confirm the output in S3

**S3 → `quicklabs-<USER>-curated/oil/`** → you'll see folders `year=2000/`, `year=2001/`, ... `year=2025/`, each holding one `.snappy.parquet` file.

![Curated bucket with year partitions](https://pub-5c24f672454946bb951bf35f09c3964e.r2.dev/learn/aws-data-engineer/07-05-curated-bucket-partitions.png)

> **Ask AI — CSV vs Parquet**
> ```
> Explain the difference between row-based formats like CSV and columnar
> formats like Parquet, specifically why columnar storage makes analytical
> queries (e.g. "average closing price per year") so much faster and
> cheaper to scan. Also explain what "partitioning by year" means in
> practice and why it lets a query engine skip reading some files entirely.
> ```

---

## Part 7 — Create the curated crawler and compare

### 7.1 Create and run a second crawler

**Glue → Crawlers → Create crawler**, same steps as Part 4 but:

| Field | Value |
|---|---|
| Name | `quicklabs-<USER>-curated-crawler` |
| Data source | `s3://quicklabs-<USER>-curated/oil/` |
| IAM role | `quicklabs-<USER>-glue-role` |
| Target database | `quicklabs_<USER>_lake` |
| Table prefix | `curated_` |

Run it, wait for `Ready`.

![Curated crawler running](https://pub-5c24f672454946bb951bf35f09c3964e.r2.dev/learn/aws-data-engineer/08-01-curated-curated-crawler.png)

### 7.2 Confirm the new table

**Glue → Databases → `quicklabs_<USER>_lake` → Tables** → you now have `curated_oil` (Parquet) sitting next to `raw_oil` (CSV).

![Two tables: raw_oil and curated_oil](https://pub-5c24f672454946bb951bf35f09c3964e.r2.dev/learn/aws-data-engineer/08-02-two-tables.png)

### 7.3 Query the curated table

```sql
SELECT year,
       COUNT(*)             AS days,
       ROUND(AVG(close), 2) AS avg_close,
       ROUND(MAX(high), 2)  AS yr_high,
       ROUND(MIN(low), 2)   AS yr_low
FROM curated_oil
GROUP BY year
ORDER BY year;
```

Expect 26 rows — one per year from 2000 to 2025.

![Athena query against curated_oil with per-year results](https://pub-5c24f672454946bb951bf35f09c3964e.r2.dev/learn/aws-data-engineer/08-03-curated-query-results.png)

### 7.4 Compare data scanned

Run the **same aggregation query** against `raw_oil` and compare the "Data scanned" stat for each run side by side (shown directly under the query results, same as Part 5).

The Parquet version scans roughly **10× less data** than the CSV version for the same answer. At terabyte scale, that gap is the difference between cents and real money.

> **Ask AI — wrap-up**
> ```
> I just built a small AWS data lake from scratch through the console:
> created S3 buckets, uploaded a raw CSV, cataloged it with a Glue Crawler,
> queried it with Athena, wrote a Glue ETL job that transformed it into
> partitioned Parquet, cataloged that too, and compared Athena's "data
> scanned" between the CSV and Parquet versions of the same query.
> Summarize what I learned as if explaining it to a colleague who knows AWS
> basics but has never touched Glue or Athena, and explain why this pattern
> (raw → catalog → transform → catalog → query) shows up in almost every
> real-world data platform.
> ```

---

## Assignment — bring your own dataset

Pick any CSV dataset from [Kaggle](https://www.kaggle.com/datasets) — stocks, weather, sports, whatever interests you — and run it through the same pipeline yourself, without a guide. Keep it under 100 MB to stay fast.

---

## Troubleshooting reference

| Symptom | Likely cause | Fix |
|---|---|---|
| `AccessDenied` on bucket creation | Name doesn't start with exactly `quicklabs-<USER>-` | Double-check slug and re-try |
| Athena uses `primary` workgroup and results bucket errors | Switched back to default workgroup | Re-select `quicklabs-<USER>-wg` from the workgroup dropdown |
| Crawler finishes but no table appears | Wrong database selected, or table prefix conflict | Delete and recreate the crawler with the correct database and prefix |
| ETL job fails immediately | Job parameters missing or wrong path | Check `--source_path` and `--target_path` under Advanced properties |
| ETL job succeeds but curated bucket empty | `--target_path` pointed at wrong bucket | Verify the path ends with `/oil/` inside the curated bucket |
| Curated crawler creates no table or wrong schema | Ran before ETL output landed, or data source path wrong | Wait for ETL to complete, re-check S3 path, re-run crawler |
| Athena `curated_oil` query returns 0 rows | Crawler ran before Parquet files existed | Re-run the curated crawler, then re-query |
