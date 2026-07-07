-- OLAP / gold tables, derived from the oltp.* mirror tables in Unity Catalog.
-- Run in a Databricks SQL editor or notebook AFTER:
--   1. databricks/setup.sql created the catalog + schemas + volume
--   2. data/pipelines/build_olap.py loaded oltp.* from data/processed/*.csv
--
-- Or run this file directly — the same statements live inline in build_olap.py
-- so PySpark and SQL paths stay in sync.

USE CATALOG db_agent_lakebase;
USE SCHEMA olap;

-- 1. customer_segments — total spend, order count, simple risk score (cancel rate)
CREATE OR REPLACE TABLE customer_segments AS
WITH agg AS (
  SELECT
    o.customer_id,
    COUNT(DISTINCT o.order_id)                                          AS total_orders,
    SUM(p.payment_value)                                                AS total_spent,
    SUM(CASE WHEN o.order_status = 'canceled' THEN 1 ELSE 0 END) * 1.0
      / NULLIF(COUNT(*), 0)                                             AS risk_score
  FROM db_agent_lakebase.oltp.orders   o
  JOIN db_agent_lakebase.oltp.payments p USING (order_id)
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
FROM agg;

-- 2. product_catalog — average price + a placeholder margin estimate per product
CREATE OR REPLACE TABLE product_catalog AS
SELECT
  p.product_id,
  p.product_category                                              AS category,
  AVG(oi.price)                                                   AS avg_price,
  -- Lab-grade margin proxy: price headroom over freight, in percent.
  AVG((oi.price - oi.freight_value) / NULLIF(oi.price, 0)) * 100  AS margin_percent
FROM db_agent_lakebase.oltp.products    p
JOIN db_agent_lakebase.oltp.order_items oi USING (product_id)
GROUP BY p.product_id, p.product_category;

-- 3. revenue_aggregates — per-customer per-quarter revenue + order counts
CREATE OR REPLACE TABLE revenue_aggregates AS
SELECT
  o.customer_id,
  DATE_TRUNC('QUARTER', o.order_purchase_timestamp) AS quarter,
  SUM(p.payment_value)                              AS total_revenue,
  COUNT(DISTINCT o.order_id)                        AS order_count
FROM db_agent_lakebase.oltp.orders   o
JOIN db_agent_lakebase.oltp.payments p USING (order_id)
GROUP BY o.customer_id, DATE_TRUNC('QUARTER', o.order_purchase_timestamp);

-- 4. category_performance — per-category per-quarter revenue + AOV
CREATE OR REPLACE TABLE category_performance AS
SELECT
  p.product_category                                  AS category,
  DATE_TRUNC('QUARTER', o.order_purchase_timestamp)   AS quarter,
  SUM(oi.price + oi.freight_value)                    AS total_revenue,
  SUM(oi.price + oi.freight_value)
    / COUNT(DISTINCT o.order_id)                      AS avg_order_value
FROM db_agent_lakebase.oltp.orders      o
JOIN db_agent_lakebase.oltp.order_items oi USING (order_id)
JOIN db_agent_lakebase.oltp.products    p  USING (product_id)
GROUP BY p.product_category, DATE_TRUNC('QUARTER', o.order_purchase_timestamp);
