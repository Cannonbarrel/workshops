-- One-time Unity Catalog setup for the lab.
-- Run as a workspace admin in the SQL editor or a notebook.

CREATE CATALOG IF NOT EXISTS db_agent_lakebase
  COMMENT 'Olist OLTP-mirror + OLAP gold for the db-agent text-to-SQL lab';

USE CATALOG db_agent_lakebase;

CREATE SCHEMA IF NOT EXISTS oltp
  COMMENT 'Mirror of Lakebase Postgres tables, materialized as Delta';

CREATE SCHEMA IF NOT EXISTS olap
  COMMENT 'Derived gold tables: customer_segments, product_catalog, revenue_aggregates, category_performance';

-- Volume holding the cleaned CSVs from data/processed/.
-- Upload via the UI (Catalog → db_agent_lakebase → oltp → raw_data → Upload),
-- the Databricks CLI, or `dbfs cp` after a workspace-files mount.
CREATE VOLUME IF NOT EXISTS oltp.raw_data
  COMMENT 'Landing zone for cleaned CSVs from data/processed/';

-- Adjust the principal to your group/SP. `account users` is the broadest read group.
GRANT USE CATALOG ON CATALOG db_agent_lakebase TO `account users`;
GRANT USE SCHEMA  ON SCHEMA  oltp              TO `account users`;
GRANT USE SCHEMA  ON SCHEMA  olap              TO `account users`;
GRANT SELECT      ON SCHEMA  oltp              TO `account users`;
GRANT SELECT      ON SCHEMA  olap              TO `account users`;
GRANT READ VOLUME ON VOLUME  oltp.raw_data     TO `account users`;
