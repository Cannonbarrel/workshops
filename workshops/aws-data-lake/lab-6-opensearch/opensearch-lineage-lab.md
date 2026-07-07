# OpenSearch Data Lineage Lab

In this lab you will build a lineage tracking system inside OpenSearch that
captures the full journey of data through the pipeline you have been building
across all 6 labs — from raw CSV ingestion to Redshift queries.

You will use OpenSearch to answer four operational questions that data engineers
face every day:

1. **Provenance** — where did this dataset come from? What transformed it?
2. **Impact analysis** — if I change the source schema, what breaks downstream?
3. **Freshness** — when was this data last updated? Did the job succeed?
4. **Dead ends** — which datasets have no downstream consumers?

---

## How lineage is modelled

Real lineage systems (AWS DataZone, Apache Atlas, OpenMetadata) store lineage as
a **directed graph**: nodes are datasets and jobs; edges are the relationships
between them (reads-from, writes-to).

OpenSearch is not a graph database, so we model the graph with three indices:

| Index | What it stores |
|---|---|
| `lineage_nodes` | Every dataset and job — one document per asset |
| `lineage_edges` | Directed connections — `source_id → target_id` |
| `lineage_runs` | Execution history — one document per job run |

To traverse the graph you run queries on edges: find all edges where
`target_id = my_node` (upstream) or `source_id = my_node` (downstream).

---

## The pipeline we are tracking

This is the crude oil data pipeline from Labs 1–4:

```
[S3 raw CSV]
     │  raw_ingest_job (manual upload)
     ▼
[Glue Catalog: oil_raw table]
     │  oil_crawler (Glue Crawler)
     ▼
[S3 curated Parquet]
     │  oil_etl_job (oil_csv_to_parquet.py)
     ▼
[Glue Catalog: oil_curated table]
     │  athena_query (on-demand)
     ▼
[Redshift Spectrum: ext_oil table]
     │  redshift_copy_job
     ▼
[Redshift: native oil_native table]
```

---

## PART 1 — Create the lineage indices

Run all commands in Dev Tools as your admin user.

### Index 1 — lineage_nodes

```
PUT /lineage_nodes
{
  "mappings": {
    "properties": {
      "node_id":      { "type": "keyword" },
      "node_type":    { "type": "keyword" },
      "name":         { "type": "text", "fields": { "raw": { "type": "keyword" } } },
      "description":  { "type": "text" },
      "owner":        { "type": "keyword" },
      "platform":     { "type": "keyword" },
      "location":     { "type": "keyword" },
      "schema_fields":{ "type": "keyword" },
      "tags":         { "type": "keyword" },
      "created_at":   { "type": "date" },
      "updated_at":   { "type": "date" }
    }
  }
}
```

### Index 2 — lineage_edges

```
PUT /lineage_edges
{
  "mappings": {
    "properties": {
      "edge_id":        { "type": "keyword" },
      "source_id":      { "type": "keyword" },
      "source_name":    { "type": "keyword" },
      "target_id":      { "type": "keyword" },
      "target_name":    { "type": "keyword" },
      "relationship":   { "type": "keyword" },
      "job_id":         { "type": "keyword" },
      "created_at":     { "type": "date" }
    }
  }
}
```

### Index 3 — lineage_runs

```
PUT /lineage_runs
{
  "mappings": {
    "properties": {
      "run_id":         { "type": "keyword" },
      "job_id":         { "type": "keyword" },
      "job_name":       { "type": "keyword" },
      "status":         { "type": "keyword" },
      "started_at":     { "type": "date" },
      "completed_at":   { "type": "date" },
      "duration_sec":   { "type": "integer" },
      "rows_read":      { "type": "long" },
      "rows_written":   { "type": "long" },
      "error_message":  { "type": "text" }
    }
  }
}
```

---

## PART 2 — Load nodes (datasets and jobs)

### 2A — Dataset nodes

```
POST /lineage_nodes/_bulk
{"index":{"_id":"ds-001"}}
{"node_id":"ds-001","node_type":"dataset","name":"S3 Raw Oil CSV","description":"Raw crude oil price history uploaded from Kaggle. Source of truth for the entire pipeline.","owner":"data-engineering","platform":"S3","location":"s3://quicklabs-studentNN-raw/oil_drop/","schema_fields":["Date","Open","High","Low","Close","Volume","ticker","name"],"tags":["raw","csv","oil","source"],"created_at":"2024-01-15","updated_at":"2024-11-01"}
{"index":{"_id":"ds-002"}}
{"node_id":"ds-002","node_type":"dataset","name":"Glue Catalog: oil_raw","description":"Glue Data Catalog table created by the oil crawler over the raw S3 prefix. Enables SQL access to raw CSV via Athena.","owner":"data-engineering","platform":"Glue Catalog","location":"glue://quicklabs_studentNN_lake.oil_raw","schema_fields":["trade_ts","open","high","low","close","volume","ticker","name"],"tags":["catalog","raw","oil","glue"],"created_at":"2024-01-16","updated_at":"2024-11-01"}
{"index":{"_id":"ds-003"}}
{"node_id":"ds-003","node_type":"dataset","name":"S3 Curated Oil Parquet","description":"Partitioned Parquet output of the Glue ETL job. Columnar format, partitioned by year and month.","owner":"data-engineering","platform":"S3","location":"s3://quicklabs-studentNN-curated/oil_curated/","schema_fields":["trade_ts","open","high","low","close","volume","ticker","name","year","month","day"],"tags":["curated","parquet","oil","partitioned"],"created_at":"2024-01-17","updated_at":"2024-11-02"}
{"index":{"_id":"ds-004"}}
{"node_id":"ds-004","node_type":"dataset","name":"Glue Catalog: oil_curated","description":"Glue Data Catalog table over the curated Parquet prefix. Created by the crawler in Lab 4. Used by Redshift Spectrum.","owner":"data-engineering","platform":"Glue Catalog","location":"glue://spectrum_oil_studentNN.oil_curated","schema_fields":["trade_ts","open","high","low","close","volume","ticker","name","year","month","day"],"tags":["catalog","curated","oil","glue","spectrum"],"created_at":"2024-01-17","updated_at":"2024-11-02"}
{"index":{"_id":"ds-005"}}
{"node_id":"ds-005","node_type":"dataset","name":"Redshift Spectrum: ext_oil_studentNN","description":"External schema in Redshift pointing to the Glue catalog. No data movement — Redshift reads Parquet from S3 at query time.","owner":"analytics","platform":"Redshift Serverless","location":"redshift://dev.ext_oil_studentNN.oil_curated","schema_fields":["trade_ts","open","high","low","close","volume","ticker","name","year","month","day"],"tags":["spectrum","external","redshift","oil"],"created_at":"2024-02-01","updated_at":"2024-11-03"}
{"index":{"_id":"ds-006"}}
{"node_id":"ds-006","node_type":"dataset","name":"Redshift Native: oil_native","description":"Native Redshift table loaded by COPY from S3 Parquet. Sorted by trade_ts, distributed by ticker. Used for high-frequency analyst queries.","owner":"analytics","platform":"Redshift Serverless","location":"redshift://dev.public.oil_native","schema_fields":["trade_ts","open","high","low","close","volume","ticker","name"],"tags":["native","redshift","oil","analytics"],"created_at":"2024-02-05","updated_at":"2024-11-04"}
```

### 2B — Job nodes

```
POST /lineage_nodes/_bulk
{"index":{"_id":"job-001"}}
{"node_id":"job-001","node_type":"job","name":"raw_ingest_job","description":"Manual or script-driven upload of Crude_Oil_historical_data.csv to the raw S3 prefix. Entry point of the pipeline.","owner":"data-engineering","platform":"S3 CLI / boto3","location":"labs/aws-data-lake/lab-5-cdc/rds-source/load_oil.sh","tags":["ingest","manual","csv"],"created_at":"2024-01-15","updated_at":"2024-11-01"}
{"index":{"_id":"job-002"}}
{"node_id":"job-002","node_type":"job","name":"oil_crawler","description":"Glue Crawler that scans the raw S3 prefix and upserts schema into the Glue Data Catalog. Detects new partitions and schema changes.","owner":"data-engineering","platform":"Glue Crawler","location":"aws://glue/crawlers/quicklabs-studentNN-oil-crawler","tags":["crawler","glue","schema-discovery"],"created_at":"2024-01-16","updated_at":"2024-11-01"}
{"index":{"_id":"job-003"}}
{"node_id":"job-003","node_type":"job","name":"oil_etl_job","description":"Glue ETL job (oil_csv_to_parquet.py) that reads raw CSV, cleans nulls, casts types, and writes partitioned Parquet to the curated S3 prefix.","owner":"data-engineering","platform":"Glue ETL","location":"s3://quicklabs-studentNN-scripts/oil_csv_to_parquet.py","tags":["etl","glue","parquet","transform"],"created_at":"2024-01-17","updated_at":"2024-11-02"}
{"index":{"_id":"job-004"}}
{"node_id":"job-004","node_type":"job","name":"curated_crawler","description":"Glue Crawler over the curated Parquet prefix. Creates the oil_curated catalog table used by Redshift Spectrum and Athena.","owner":"data-engineering","platform":"Glue Crawler","location":"aws://glue/crawlers/quicklabs-studentNN-oil-crawler","tags":["crawler","glue","curated","spectrum"],"created_at":"2024-01-17","updated_at":"2024-11-02"}
{"index":{"_id":"job-005"}}
{"node_id":"job-005","node_type":"job","name":"redshift_copy_job","description":"Redshift COPY command that loads curated Parquet from S3 into the native oil_native table. Runs nightly via scheduled query.","owner":"analytics","platform":"Redshift Serverless","location":"redshift://dev/scheduled-queries/oil-nightly-load","tags":["copy","redshift","load","scheduled"],"created_at":"2024-02-05","updated_at":"2024-11-04"}
```

Verify nodes loaded:

```
GET /lineage_nodes/_count
```

Expect 11 (6 datasets + 5 jobs).

---

## PART 3 — Load edges (the relationships)

Each edge is a directed link: `source_id → target_id`.

```
POST /lineage_edges/_bulk
{"index":{"_id":"edge-001"}}
{"edge_id":"edge-001","source_id":"ds-001","source_name":"S3 Raw Oil CSV","target_id":"job-001","target_name":"raw_ingest_job","relationship":"produced_by","job_id":"job-001","created_at":"2024-01-15"}
{"index":{"_id":"edge-002"}}
{"edge_id":"edge-002","source_id":"job-002","source_name":"oil_crawler","target_id":"ds-002","target_name":"Glue Catalog: oil_raw","relationship":"writes_to","job_id":"job-002","created_at":"2024-01-16"}
{"index":{"_id":"edge-003"}}
{"edge_id":"edge-003","source_id":"ds-001","source_name":"S3 Raw Oil CSV","target_id":"job-002","target_name":"oil_crawler","relationship":"read_by","job_id":"job-002","created_at":"2024-01-16"}
{"index":{"_id":"edge-004"}}
{"edge_id":"edge-004","source_id":"ds-001","source_name":"S3 Raw Oil CSV","target_id":"job-003","target_name":"oil_etl_job","relationship":"read_by","job_id":"job-003","created_at":"2024-01-17"}
{"index":{"_id":"edge-005"}}
{"edge_id":"edge-005","source_id":"job-003","source_name":"oil_etl_job","target_id":"ds-003","target_name":"S3 Curated Oil Parquet","relationship":"writes_to","job_id":"job-003","created_at":"2024-01-17"}
{"index":{"_id":"edge-006"}}
{"edge_id":"edge-006","source_id":"ds-003","source_name":"S3 Curated Oil Parquet","target_id":"job-004","target_name":"curated_crawler","relationship":"read_by","job_id":"job-004","created_at":"2024-01-17"}
{"index":{"_id":"edge-007"}}
{"edge_id":"edge-007","source_id":"job-004","source_name":"curated_crawler","target_id":"ds-004","target_name":"Glue Catalog: oil_curated","relationship":"writes_to","job_id":"job-004","created_at":"2024-01-17"}
{"index":{"_id":"edge-008"}}
{"edge_id":"edge-008","source_id":"ds-004","source_name":"Glue Catalog: oil_curated","target_id":"ds-005","target_name":"Redshift Spectrum: ext_oil_studentNN","relationship":"referenced_by","job_id":null,"created_at":"2024-02-01"}
{"index":{"_id":"edge-009"}}
{"edge_id":"edge-009","source_id":"ds-003","source_name":"S3 Curated Oil Parquet","target_id":"job-005","target_name":"redshift_copy_job","relationship":"read_by","job_id":"job-005","created_at":"2024-02-05"}
{"index":{"_id":"edge-010"}}
{"edge_id":"edge-010","source_id":"job-005","source_name":"redshift_copy_job","target_id":"ds-006","target_name":"Redshift Native: oil_native","relationship":"writes_to","job_id":"job-005","created_at":"2024-02-05"}
```

Verify:

```
GET /lineage_edges/_count
```

Expect 10 edges.

---

## PART 4 — Load job run history

Simulate 2 weeks of nightly job runs including two failures.

```
POST /lineage_runs/_bulk
{"index":{"_id":"run-001"}}
{"run_id":"run-001","job_id":"job-003","job_name":"oil_etl_job","status":"success","started_at":"2024-10-28T02:00:00","completed_at":"2024-10-28T02:04:12","duration_sec":252,"rows_read":6367,"rows_written":6367,"error_message":null}
{"index":{"_id":"run-002"}}
{"run_id":"run-002","job_id":"job-005","job_name":"redshift_copy_job","status":"success","started_at":"2024-10-28T03:00:00","completed_at":"2024-10-28T03:01:45","duration_sec":105,"rows_read":6367,"rows_written":6367,"error_message":null}
{"index":{"_id":"run-003"}}
{"run_id":"run-003","job_id":"job-003","job_name":"oil_etl_job","status":"success","started_at":"2024-10-29T02:00:00","completed_at":"2024-10-29T02:03:58","duration_sec":238,"rows_read":6367,"rows_written":6367,"error_message":null}
{"index":{"_id":"run-004"}}
{"run_id":"run-004","job_id":"job-005","job_name":"redshift_copy_job","status":"failed","started_at":"2024-10-29T03:00:00","completed_at":"2024-10-29T03:00:09","duration_sec":9,"rows_read":0,"rows_written":0,"error_message":"S3ServiceException: Access Denied on s3://quicklabs-studentNN-curated/oil_curated/ — IAM role missing s3:GetObject"}
{"index":{"_id":"run-005"}}
{"run_id":"run-005","job_id":"job-003","job_name":"oil_etl_job","status":"success","started_at":"2024-10-30T02:00:00","completed_at":"2024-10-30T02:04:30","duration_sec":270,"rows_read":6367,"rows_written":6367,"error_message":null}
{"index":{"_id":"run-006"}}
{"run_id":"run-006","job_id":"job-005","job_name":"redshift_copy_job","status":"success","started_at":"2024-10-30T03:00:00","completed_at":"2024-10-30T03:01:52","duration_sec":112,"rows_read":6367,"rows_written":6367,"error_message":null}
{"index":{"_id":"run-007"}}
{"run_id":"run-007","job_id":"job-003","job_name":"oil_etl_job","status":"failed","started_at":"2024-10-31T02:00:00","completed_at":"2024-10-31T02:00:22","duration_sec":22,"rows_read":0,"rows_written":0,"error_message":"GlueException: Script s3://quicklabs-studentNN-scripts/oil_csv_to_parquet.py not found — bucket may have been deleted"}
{"index":{"_id":"run-008"}}
{"run_id":"run-008","job_id":"job-003","job_name":"oil_etl_job","status":"success","started_at":"2024-11-01T02:00:00","completed_at":"2024-11-01T02:04:05","duration_sec":245,"rows_read":6367,"rows_written":6367,"error_message":null}
{"index":{"_id":"run-009"}}
{"run_id":"run-009","job_id":"job-005","job_name":"redshift_copy_job","status":"success","started_at":"2024-11-01T03:00:00","completed_at":"2024-11-01T03:01:40","duration_sec":100,"rows_read":6367,"rows_written":6367,"error_message":null}
{"index":{"_id":"run-010"}}
{"run_id":"run-010","job_id":"job-002","job_name":"oil_crawler","status":"success","started_at":"2024-11-01T01:30:00","completed_at":"2024-11-01T01:31:22","duration_sec":82,"rows_read":1,"rows_written":1,"error_message":null}
{"index":{"_id":"run-011"}}
{"run_id":"run-011","job_id":"job-004","job_name":"curated_crawler","status":"success","started_at":"2024-11-01T02:06:00","completed_at":"2024-11-01T02:07:14","duration_sec":74,"rows_read":1,"rows_written":1,"error_message":null}
{"index":{"_id":"run-012"}}
{"run_id":"run-012","job_id":"job-003","job_name":"oil_etl_job","status":"success","started_at":"2024-11-02T02:00:00","completed_at":"2024-11-02T02:04:18","duration_sec":258,"rows_read":6367,"rows_written":6367,"error_message":null}
{"index":{"_id":"run-013"}}
{"run_id":"run-013","job_id":"job-005","job_name":"redshift_copy_job","status":"success","started_at":"2024-11-02T03:00:00","completed_at":"2024-11-02T03:01:55","duration_sec":115,"rows_read":6367,"rows_written":6367,"error_message":null}
```

Verify:

```
GET /lineage_runs/_count
```

Expect 13 runs.

---

## PART 5 — Lineage queries

### Q1 — PROVENANCE: Where did `oil_native` come from?

Find all edges where `target_id` is the Redshift native table (`ds-006`):

```
GET /lineage_edges/_search
{
  "query": {
    "term": { "target_id": "ds-006" }
  }
}
```

This returns `edge-010`: the `redshift_copy_job` writes to `oil_native`.

Now trace one level further — what feeds `redshift_copy_job` (`job-005`)?

```
GET /lineage_edges/_search
{
  "query": {
    "term": { "target_id": "job-005" }
  }
}
```

Returns `edge-009`: the S3 Curated Parquet (`ds-003`) is read by the copy job.

And what produced `ds-003`?

```
GET /lineage_edges/_search
{
  "query": {
    "term": { "target_id": "ds-003" }
  }
}
```

Returns `edge-005`: `oil_etl_job` writes to `ds-003`.

**Full provenance chain you just traced:**
```
S3 Raw CSV → oil_etl_job → S3 Curated Parquet → redshift_copy_job → oil_native
```

---

### Q2 — IMPACT ANALYSIS: If I change the schema of the raw CSV, what breaks?

Find all edges where `source_id = ds-001` (the raw CSV):

```
GET /lineage_edges/_search
{
  "query": {
    "term": { "source_id": "ds-001" }
  }
}
```

This returns three edges — the raw CSV feeds:
- `oil_crawler` (job-002) → which updates `oil_raw` catalog
- `oil_etl_job` (job-003) → which writes to `oil_curated` Parquet

Now find what those jobs produce (all edges where source is one of those jobs):

```
GET /lineage_edges/_search
{
  "query": {
    "terms": {
      "source_id": ["job-002", "job-003"]
    }
  }
}
```

**Impact blast radius of a raw schema change:**
```
ds-001 (raw CSV)
  ├── job-002 (crawler) → ds-002 (Glue catalog: oil_raw)
  └── job-003 (ETL)    → ds-003 (S3 Curated Parquet)
                              └── job-004 (crawler)  → ds-004 (Glue: oil_curated)
                              │                              └── ds-005 (Spectrum)
                              └── job-005 (COPY)     → ds-006 (Redshift native)
```

**Five downstream assets are affected by a change to the raw CSV.**

---

### Q3 — FIELD LINEAGE: Which datasets carry the `volume` field?

```
GET /lineage_nodes/_search
{
  "query": {
    "term": { "schema_fields": "volume" }
  },
  "_source": ["node_id", "name", "node_type", "platform"]
}
```

This shows every node in the pipeline that exposes the `volume` field — useful
when someone asks "can I safely rename this column?"

---

### Q4 — FRESHNESS: When was each dataset last updated?

```
GET /lineage_nodes/_search
{
  "size": 20,
  "_source": ["name", "node_type", "platform", "updated_at"],
  "query": {
    "term": { "node_type": "dataset" }
  },
  "sort": [
    { "updated_at": { "order": "asc" } }
  ]
}
```

Datasets sorted oldest-first — the ones at the top need attention.

---

### Q5 — JOB HEALTH: Which jobs have failed recently?

```
GET /lineage_runs/_search
{
  "query": {
    "term": { "status": "failed" }
  },
  "_source": ["job_name", "started_at", "duration_sec", "error_message"],
  "sort": [{ "started_at": { "order": "desc" } }]
}
```

Two failures appear: the Redshift COPY (access denied) and the ETL job (missing
script). The `error_message` field tells you exactly what went wrong.

---

### Q6 — JOB RELIABILITY: Success rate per job

```
GET /lineage_runs/_search
{
  "size": 0,
  "aggs": {
    "by_job": {
      "terms": { "field": "job_id" },
      "aggs": {
        "by_status": {
          "terms": { "field": "status" }
        },
        "avg_duration": {
          "avg": { "field": "duration_sec" }
        }
      }
    }
  }
}
```

For each job: how many runs succeeded vs failed, and average duration.

---

### Q7 — ORPHAN DETECTION: Which datasets have no downstream consumers?

First, collect all node IDs that appear as a source in any edge:

```
GET /lineage_edges/_search
{
  "size": 0,
  "aggs": {
    "active_sources": {
      "terms": { "field": "source_id", "size": 50 }
    }
  }
}
```

Then query all dataset nodes:

```
GET /lineage_nodes/_search
{
  "query": { "term": { "node_type": "dataset" } },
  "_source": ["node_id", "name"]
}
```

Compare the two lists. Any dataset node **not** appearing as a `source_id` in any
edge is an orphan — it was produced but nothing consumes it. In our pipeline,
`ds-006` (Redshift native) is the terminal node — expected. But if an intermediate
table like `ds-003` had no outbound edges, that would be a dead-end dataset worth
investigating.

---

### Q8 — AUDIT TRAIL: Full history of the ETL job

```
GET /lineage_runs/_search
{
  "query": {
    "term": { "job_id": "job-003" }
  },
  "_source": ["run_id", "status", "started_at", "duration_sec", "rows_written", "error_message"],
  "sort": [{ "started_at": { "order": "asc" } }]
}
```

You can see the job's run history: normal runs at ~250 seconds, the one failure
on Oct 31, and recovery the next day.

---

## PART 6 — Build a lineage dashboard in Dashboards

### Step 1 — Create index patterns

Go to **Stack Management → Index Patterns** and create one pattern for each index:

- `lineage_nodes`  (no time filter — the data is static metadata)
- `lineage_edges`  (no time filter)
- `lineage_runs`   (time field: `started_at`)

### Step 2 — Pipeline health overview (Data Table)

1. Visualize → Create → Data Table → source `lineage_runs`
2. Metric: Count
3. Buckets → Split rows → Terms → Field: `job_name` → size 10
4. Add sub-bucket → Terms → Field: `status` → size 5
5. Run. You get a grid: job × status showing success / failed counts
6. Save as: **Job Run Summary**

### Step 3 — Job duration trend (Line chart)

1. Visualize → Create → Line → source `lineage_runs`
2. Y-axis: Average → Field: `duration_sec`
3. X-axis: Date Histogram → Field: `started_at` → Minimum interval: Daily
4. Add series split → Terms → Field: `job_name`
5. Run. A line per job showing duration over time — spikes indicate problems.
6. Save as: **Job Duration Trend**

### Step 4 — Pipeline asset inventory (Data Table)

1. Visualize → Create → Data Table → source `lineage_nodes`
2. Metric: Count
3. Split rows → Terms → `node_type` → then sub-bucket Terms → `platform`
4. Run. A breakdown of how many datasets and jobs exist per platform.
5. Save as: **Asset Inventory by Platform**

### Step 5 — Failed runs (Metric)

1. Visualize → Create → Metric → source `lineage_runs`
2. Metric: Count
3. Add filter at top: `status: failed`
4. The big number shows total failed runs.
5. Save as: **Failed Runs**

### Step 6 — Assemble the lineage dashboard

Dashboard → Create → Add all four panels:
- **Failed Runs** (top-left, small metric)
- **Job Run Summary** (top-right, wide table)
- **Job Duration Trend** (middle, full width)
- **Asset Inventory by Platform** (bottom)

Save as: **Data Pipeline Lineage Overview**

---

## PART 7 — Simulate a pipeline event and watch lineage update

The ETL job ran successfully today. Add a new run record and observe the
dashboard refresh:

```
POST /lineage_runs/_doc/run-014
{
  "run_id":       "run-014",
  "job_id":       "job-003",
  "job_name":     "oil_etl_job",
  "status":       "success",
  "started_at":   "2024-11-03T02:00:00",
  "completed_at": "2024-11-03T02:04:22",
  "duration_sec": 262,
  "rows_read":    6367,
  "rows_written": 6367,
  "error_message": null
}
```

Go to the dashboard and refresh. The **Job Duration Trend** chart now shows
today's run, and **Job Run Summary** count for `oil_etl_job` increased by one.

Also update the dataset freshness timestamp to reflect the new run:

```
POST /lineage_nodes/_update/ds-003
{
  "doc": {
    "updated_at": "2024-11-03"
  }
}
```

Re-run the freshness query from Q4 and confirm `ds-003` is no longer the oldest.

---

## Troubleshooting

| What you see | What to do |
|---|---|
| Provenance query returns 0 hits | Confirm the `_id` in edges matches the `node_id` in nodes — they must be identical strings |
| Dashboard chart shows "No results" | Check the index pattern time range — `lineage_runs` uses `started_at`; set the time picker to last 30 days |
| `date` field parse error on bulk load | Dates must be `YYYY-MM-DD` or `YYYY-MM-DDTHH:MM:SS` — no other formats accepted without a custom mapping |
| Aggregation on `name` field fails | Use `name.raw` (the keyword sub-field), not `name` (the text field) |
| Updated `updated_at` not showing in freshness query | Refresh the index: `POST /lineage_nodes/_refresh`, then re-run |

---

## What you learned

- **Graph-in-a-document-store**: lineage graphs can be modelled in OpenSearch using nodes + edges indices. Traversal requires multiple queries; a dedicated graph DB (Neptune, Neo4j) handles multi-hop traversal natively.
- **Provenance**: tracing backward through edges from a target dataset to find its origin.
- **Impact analysis**: tracing forward from a source to find all downstream consumers — essential before schema changes.
- **Field lineage**: querying `schema_fields` across nodes to find every dataset that exposes a specific column.
- **Freshness + reliability**: the `lineage_runs` index gives you a job execution log — searchable and aggregatable like any other data.
- **Real systems**: AWS DataZone, Apache Atlas, and OpenMetadata use exactly this node/edge model internally. What you built here is a functional miniature version of what those platforms provide.
