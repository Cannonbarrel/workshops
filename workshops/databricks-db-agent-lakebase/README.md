# Text-to-SQL on Databricks Without Model Serving

A minimal, working lab that wires three boring pieces together:

1. **Lakebase (Postgres)** — OLTP store, loaded from the Olist Brazilian e‑commerce dataset
2. **Databricks Unity Catalog** — OLAP store; gold tables built as Delta from the same data
3. **Self-hosted vLLM** — OpenAI-compatible LLM endpoint on a Shadeform GPU box

The agent (text → SQL) lives in a separate repo. This repo only sets up the data and infra it needs.

## Layout

```
data/
  raw/                # input CSVs (gitignored — bring your own)
  processed/          # cleaned CSVs written by load_oltp.py
  sql/                # OLTP + OLAP DDL
  pipelines/          # load_oltp.py, build_olap.py
  metadata/           # one JSON per table (LLM-facing schema docs)
databricks/           # catalog/schema/volume setup + cluster notes
vllm/                 # Dockerfile, run.sh, config.yaml, deploy notes
```

## Dataset

This repo does **not** include the raw data. It expects the Olist Brazilian E‑Commerce Public Dataset to be downloaded into [data/raw/](data/raw/) before you run the pipeline. The dataset is licensed CC BY-NC-SA 4.0 by Olist and isn't redistributable here.

Source: <https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce>

**Option A — Kaggle CLI (recommended):**

```bash
# One-time: install + auth
pip install kaggle
mkdir -p ~/.kaggle
# Download kaggle.json from https://www.kaggle.com/settings → Create New Token, then:
mv ~/Downloads/kaggle.json ~/.kaggle/ && chmod 600 ~/.kaggle/kaggle.json

# Fetch + unzip into data/raw/
cd labs/databricks-db-agent-lakebase
kaggle datasets download -d olistbr/brazilian-ecommerce -p data/raw/ --unzip
```

**Option B — manual:** download the zip from the Kaggle page, unzip into `data/raw/`.

Either way, the pipeline reads these five files by their original Olist names and ignores the rest:

```
data/raw/
├── olist_customers_dataset.csv
├── olist_orders_dataset.csv
├── olist_order_items_dataset.csv
├── olist_products_dataset.csv
└── olist_order_payments_dataset.csv
```

The geolocation, reviews, and sellers CSVs aren't needed. `data/raw/*.csv` is gitignored — verify with `git status` before committing.

## End-to-end flow

```
   data/raw/*.csv
        │
        ▼
   load_oltp.py ─────► Lakebase Postgres   (OLTP, source of truth)
        │
        ├─► data/processed/*.csv  (cleaned, used by OLAP path)
        │
        ▼
   upload to UC Volume
        │
        ▼
   build_olap.py  ───► Unity Catalog Delta  (OLAP, gold tables)
        │
        ▼
   vLLM endpoint  ◄── agent issues text→SQL against the gold tables
```

## Prereqs

- Databricks workspace with **Unity Catalog enabled** and **Lakebase enabled** (Compute → Lakebase tab visible)
- **Databricks CLI ≥ 0.220** — `brew install databricks/tap/databricks`
- **psql** — `brew install postgresql@16`
- **Python 3.10+**
- A Databricks **personal access token** (PAT) — Settings → Developer → Access tokens. Use a long-lived expiry; this PAT is reused as both the Databricks CLI token and the Lakebase Postgres password.
- (For vLLM step) A Hugging Face account with access to your chosen model + a Shadeform GPU instance

## Step-by-step setup (verified)

### 0. Get the dataset

The raw CSVs are not committed. Download them from Kaggle into [data/raw/](data/raw/) before continuing — see the [Dataset](#dataset) section above for the exact `kaggle datasets download` command. Verify:

```bash
ls data/raw/olist_*.csv | wc -l    # should be 9 if you used --unzip; the pipeline only needs 5
```

### 1. Create the Lakebase instance

Databricks console → **Compute → Lakebase → Create database instance**:

- Name: `db-agent-oltp`
- Capacity: smallest tier
- Region: same as your workspace

Once `Available`, click the instance and copy the **hostname** from Connection details. It looks like `ep-<two-words>-<id>.database.<region>.cloud.databricks.com`.

### 2. Set environment variables

The Postgres **username is your Databricks email** (URL-encode the `@` as `%40`). The Postgres **password is your Databricks PAT** — Lakebase accepts a PAT as the auth credential, no separate token generation needed.

```bash
export LAKEBASE_HOST="ep-<your-instance-id>.database.<region>.cloud.databricks.com"
export DATABRICKS_HOST="https://dbc-XXXXXXXX-XXXX.cloud.databricks.com"
export DATABRICKS_TOKEN="dapiXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"

# Lakebase ships with a default database `databricks_postgres`. We use it as-is.
export PGPASSWORD="$DATABRICKS_TOKEN"
export LAKEBASE_URL="postgresql://your.email%40example.com@${LAKEBASE_HOST}/databricks_postgres?sslmode=require"

psql "$LAKEBASE_URL" -c "SELECT current_database(), version();"   # verify
```

### 3. Apply the OLTP schema and load data

```bash
cd labs/databricks-db-agent-lakebase
python3 -m venv .venv && source .venv/bin/activate
pip install -r data/pipelines/requirements.txt

psql "$LAKEBASE_URL" -f data/sql/oltp_schema.sql
psql "$LAKEBASE_URL" -c "\dt"                # verify: 5 tables in public schema

python data/pipelines/load_oltp.py            # ~30s; writes to Postgres + data/processed/

psql "$LAKEBASE_URL" -c "
  SELECT 'customers'   t, COUNT(*) FROM customers   UNION ALL
  SELECT 'orders'      , COUNT(*) FROM orders       UNION ALL
  SELECT 'order_items' , COUNT(*) FROM order_items  UNION ALL
  SELECT 'products'    , COUNT(*) FROM products     UNION ALL
  SELECT 'payments'    , COUNT(*) FROM payments;"
```

Expect ~99K customers, ~99K orders, ~112K line items, ~33K products, ~104K payments.

### 4. Bootstrap Unity Catalog

In the Databricks **SQL editor**, paste [databricks/setup.sql](databricks/setup.sql) and **Run all**. This creates:

- `db_agent_lakebase` catalog
- `oltp`, `olap` schemas
- `oltp.raw_data` volume

### 5. Upload cleaned CSVs to the UC volume

```bash
databricks fs cp -r data/processed/ \
  dbfs:/Volumes/db_agent_lakebase/oltp/raw_data/processed/ --overwrite

databricks fs ls dbfs:/Volumes/db_agent_lakebase/oltp/raw_data/processed/    # verify: 5 CSVs
```

### 6. Build OLAP gold tables

1. Workspace → **Import** → upload [data/pipelines/build_olap.py](data/pipelines/build_olap.py) as a notebook.
2. Attach to a **UC-enabled cluster** (DBR 13.3 LTS+, single-node `m6i.large` is plenty).
3. **Run All**. Output ends with `OLAP build complete.`

Verify in the SQL editor:
```sql
SELECT segment, COUNT(*) AS customers, ROUND(AVG(total_spent), 2) AS avg_spend
FROM db_agent_lakebase.olap.customer_segments
GROUP BY segment ORDER BY avg_spend DESC;
```

### 7. Wire up Lakehouse Federation (optional — required for cross-store queries)

Without this step, the agent can query Postgres OR UC but not join across them in a single SQL statement. With it, queries can mix live OLTP rows from Lakebase with pre-aggregated gold tables from UC.

**a. Store the Lakebase password (your PAT) in a Databricks secret scope:**
```bash
databricks secrets create-scope lakebase
databricks secrets put-secret lakebase token --string-value "$DATABRICKS_TOKEN"
databricks secrets list-secrets lakebase                              # verify
```

**b. Create the connection + foreign catalog** in the Databricks SQL editor:
```sql
CREATE CONNECTION lakebase_olist TYPE postgresql OPTIONS (
  host     'ep-<your-instance-id>.database.<region>.cloud.databricks.com',
  port     '5432',
  user     'your.email@example.com',
  password secret('lakebase', 'token')
);

CREATE FOREIGN CATALOG lakebase_olist
  USING CONNECTION lakebase_olist
  OPTIONS (database 'databricks_postgres');     -- the DB where your tables actually live
```

**c. Verify discovery:**
```sql
SHOW SCHEMAS IN lakebase_olist;
SHOW TABLES IN lakebase_olist.public;          -- should list orders, customers, products, …
SELECT * FROM lakebase_olist.public.orders LIMIT 5;
```

If `OPTIONS (database '…')` doesn't match where your tables actually are, `SHOW TABLES` will be empty. To confirm the right database name, run:
```bash
psql "$LAKEBASE_URL" -c "
  SELECT table_catalog, table_schema, table_name
  FROM information_schema.tables
  WHERE table_name IN ('orders','customers','products');"
```

### 8. (Optional) Deploy vLLM on Shadeform

See [vllm/README.md](vllm/README.md) for the GPU instance + Docker steps.

## Demo queries the schema must support

The OLTP + OLAP tables are designed so a text-to-SQL agent can answer:

1. **Top customers by revenue last quarter** — `revenue_aggregates` filtered by `quarter`, ordered by `total_revenue`
2. **Revenue by product category** — `category_performance` aggregated across quarters
3. **High-value customers and their order patterns** — `customer_segments` joined to `orders`
4. **Cross-table joins (customers + orders + products)** — supported via `oltp.*` Delta mirror tables
5. **Cross-store join (live OLTP × precomputed OLAP)** — requires step 7 (federation):

   ```sql
   SELECT
     pg.order_id, pg.order_status, pg.order_purchase_timestamp,
     cs.segment,  cs.total_spent
   FROM lakebase_olist.public.orders             pg     -- Lakebase Postgres (live)
   JOIN db_agent_lakebase.olap.customer_segments cs     -- Unity Catalog Delta (gold)
     USING (customer_id)
   WHERE pg.order_status IN ('shipped', 'invoiced')
     AND cs.segment = 'high';
   ```

See [data/metadata/](data/metadata/) for per-table descriptions the agent's prompt builder consumes.

## Notes from a real run

- **Use your Databricks PAT as the Lakebase password.** Lakebase-generated short-lived tokens (`databricks lakebase database-instances generate-credential`) expire in ~1h and will silently rot the federation connection. PATs let you control rotation.
- **Default database is `databricks_postgres`.** Unless you explicitly `CREATE DATABASE olist;` first and re-export `LAKEBASE_URL` to point at it, your tables land in `databricks_postgres.public`. The federation foreign catalog must point at whichever DB you actually used.
- **PostgreSQL connection options are limited.** `CREATE CONNECTION ... TYPE postgresql` only supports `host`, `port`, `user`, `password`, `trustServerCertificate`. The `database` option goes on the `FOREIGN CATALOG`, not the connection. OAuth options (`auth_type`, `oauth_*`) are not supported for the postgresql connector — use a PAT in a secret.
- **Email-as-username must be URL-encoded** in `LAKEBASE_URL` (replace `@` with `%40`). Plain Postgres clients don't tolerate the literal `@` in the userinfo segment of the URL.
