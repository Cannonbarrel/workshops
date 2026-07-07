"""Build OLAP gold tables as Delta in Unity Catalog.

Run on a Databricks cluster (DBR 13+, Unity Catalog enabled) attached to the
workspace where databricks/setup.sql has been executed.

Inputs (a UC volume — upload data/processed/*.csv into it):
    /Volumes/db_agent_lakebase/oltp/raw_data/processed/{customers,orders,
        order_items,products,payments}.csv

Outputs:
    db_agent_lakebase.oltp.{customers,orders,order_items,products,payments}    — silver
    db_agent_lakebase.olap.{customer_segments,product_catalog,
                            revenue_aggregates,category_performance}           — gold

Usage:
    - Notebook: paste this file into a cell, attach to a UC cluster, Run All.
    - databricks-connect: `python data/pipelines/build_olap.py`
"""
from pyspark.sql import SparkSession, functions as F

CATALOG  = "db_agent_lakebase"
VOLUME   = f"/Volumes/{CATALOG}/oltp/raw_data/processed"

spark = SparkSession.builder.getOrCreate()
spark.sql(f"USE CATALOG {CATALOG}")


# ----- Silver: load cleaned CSVs as oltp.* Delta tables -----

def load_csv(name: str):
    return (
        spark.read
        .option("header", True)
        .option("inferSchema", True)
        .csv(f"{VOLUME}/{name}.csv")
    )

orders = (
    load_csv("orders")
    .withColumn("order_purchase_timestamp",  F.to_timestamp("order_purchase_timestamp"))
    .withColumn("order_delivered_timestamp", F.to_timestamp("order_delivered_timestamp"))
)

silver = {
    "customers":   load_csv("customers"),
    "products":    load_csv("products"),
    "orders":      orders,
    "order_items": load_csv("order_items"),
    "payments":    load_csv("payments"),
}

for name, df in silver.items():
    target = f"{CATALOG}.oltp.{name}"
    df.write.mode("overwrite").option("overwriteSchema", "true").saveAsTable(target)
    print(f"  wrote {target}: {df.count():,} rows")


# ----- Gold: derived OLAP tables (kept in lockstep with data/sql/olap_tables.sql) -----

spark.sql(f"""
CREATE OR REPLACE TABLE {CATALOG}.olap.customer_segments AS
WITH agg AS (
  SELECT
    o.customer_id,
    COUNT(DISTINCT o.order_id)                                          AS total_orders,
    SUM(p.payment_value)                                                AS total_spent,
    SUM(CASE WHEN o.order_status = 'canceled' THEN 1 ELSE 0 END) * 1.0
      / NULLIF(COUNT(*), 0)                                             AS risk_score
  FROM {CATALOG}.oltp.orders   o
  JOIN {CATALOG}.oltp.payments p USING (order_id)
  GROUP BY o.customer_id
)
SELECT
  customer_id,
  total_spent,
  total_orders,
  CASE
    WHEN total_spent >= 1000 THEN 'high'
    WHEN total_spent >= 200  THEN 'mid'
    ELSE                          'low'
  END AS segment,
  risk_score
FROM agg
""")

spark.sql(f"""
CREATE OR REPLACE TABLE {CATALOG}.olap.product_catalog AS
SELECT
  p.product_id,
  p.product_category                                              AS category,
  AVG(oi.price)                                                   AS avg_price,
  AVG((oi.price - oi.freight_value) / NULLIF(oi.price, 0)) * 100  AS margin_percent
FROM {CATALOG}.oltp.products    p
JOIN {CATALOG}.oltp.order_items oi USING (product_id)
GROUP BY p.product_id, p.product_category
""")

spark.sql(f"""
CREATE OR REPLACE TABLE {CATALOG}.olap.revenue_aggregates AS
SELECT
  o.customer_id,
  DATE_TRUNC('QUARTER', o.order_purchase_timestamp) AS quarter,
  SUM(p.payment_value)                              AS total_revenue,
  COUNT(DISTINCT o.order_id)                        AS order_count
FROM {CATALOG}.oltp.orders   o
JOIN {CATALOG}.oltp.payments p USING (order_id)
GROUP BY o.customer_id, DATE_TRUNC('QUARTER', o.order_purchase_timestamp)
""")

spark.sql(f"""
CREATE OR REPLACE TABLE {CATALOG}.olap.category_performance AS
SELECT
  p.product_category                                  AS category,
  DATE_TRUNC('QUARTER', o.order_purchase_timestamp)   AS quarter,
  SUM(oi.price + oi.freight_value)                    AS total_revenue,
  SUM(oi.price + oi.freight_value)
    / COUNT(DISTINCT o.order_id)                      AS avg_order_value
FROM {CATALOG}.oltp.orders      o
JOIN {CATALOG}.oltp.order_items oi USING (order_id)
JOIN {CATALOG}.oltp.products    p  USING (product_id)
GROUP BY p.product_category, DATE_TRUNC('QUARTER', o.order_purchase_timestamp)
""")

print("OLAP build complete.")
