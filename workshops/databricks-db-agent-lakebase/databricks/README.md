# Databricks setup

Bootstraps the Unity Catalog catalog/schemas/volume the OLAP pipeline writes into, and explains how to run [build_olap.py](../data/pipelines/build_olap.py).

## Cluster requirements

- **Runtime:** DBR 13.3 LTS or newer (any version with full UC support)
- **Access mode:** Single User or Shared (both work; Shared is needed if multiple students reuse the cluster)
- **Node:** Single-node `m6i.large` (or equivalent) is plenty — the dataset is ~120K orders
- **Unity Catalog must be enabled** on the workspace

## Steps

1. **Run the setup SQL once.** Open [setup.sql](setup.sql) in the Databricks SQL editor (or paste into a notebook cell) and run it. This creates:
   - `db_agent_lakebase` catalog
   - `oltp` and `olap` schemas
   - `oltp.raw_data` volume (the CSV landing zone)

2. **Upload cleaned CSVs to the volume.** After running [load_oltp.py](../data/pipelines/load_oltp.py) locally, copy the contents of `data/processed/` into the volume. Three options:

   ```bash
   # Databricks CLI (recommended)
   databricks fs cp -r data/processed/ \
     dbfs:/Volumes/db_agent_lakebase/oltp/raw_data/processed/
   ```

   Or use the Catalog UI → `db_agent_lakebase` → `oltp` → `raw_data` → **Upload**.

3. **Run the OLAP build.** Import [build_olap.py](../data/pipelines/build_olap.py) as a notebook (File → Import → URL works on a github raw URL, or upload), attach to the cluster, **Run All**.

   This writes:
   - `db_agent_lakebase.oltp.{customers, products, orders, order_items, payments}` (silver mirror)
   - `db_agent_lakebase.olap.{customer_segments, product_catalog, revenue_aggregates, category_performance}` (gold)

4. **Verify.** Run a smoke query in the SQL editor:

   ```sql
   SELECT segment, COUNT(*) AS customers, ROUND(AVG(total_spent), 2) AS avg_spend
   FROM db_agent_lakebase.olap.customer_segments
   GROUP BY segment
   ORDER BY avg_spend DESC;
   ```

## Re-running

Both the silver loads (`saveAsTable(... mode="overwrite")`) and the gold builds (`CREATE OR REPLACE TABLE`) are idempotent. Drop a fresh CSV in the volume and re-run the notebook to refresh.

## Lakehouse Federation (cross-store queries)

If you also want to join live Lakebase Postgres rows against UC Delta gold tables in a single SQL statement, set up a foreign catalog after step 4:

```sql
-- The connection holds host/port/user/password ONLY.
-- The postgresql connector does NOT support `database`, `auth_type`, or `oauth_*` options.
CREATE CONNECTION lakebase_olist TYPE postgresql OPTIONS (
  host     '<lakebase-host>',
  port     '5432',
  user     'your.email@example.com',
  password secret('lakebase', 'token')   -- a Databricks PAT stored via `databricks secrets put-secret`
);

-- The database goes on the FOREIGN CATALOG, not the connection.
-- Use `databricks_postgres` unless you explicitly created another DB.
CREATE FOREIGN CATALOG lakebase_olist
  USING CONNECTION lakebase_olist
  OPTIONS (database 'databricks_postgres');
```

Then a cross-store query looks like:

```sql
SELECT pg.order_id, pg.order_status, cs.segment, cs.total_spent
FROM lakebase_olist.public.orders             pg
JOIN db_agent_lakebase.olap.customer_segments cs USING (customer_id)
WHERE pg.order_status IN ('shipped', 'invoiced')
  AND cs.segment = 'high';
```

## Tearing down

```sql
DROP CATALOG IF EXISTS lakebase_olist;
DROP CONNECTION      IF EXISTS lakebase_olist;
DROP CATALOG         IF EXISTS db_agent_lakebase CASCADE;
```
