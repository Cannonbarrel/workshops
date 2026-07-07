-- Source-of-truth table for the Lake Formation "ingest from RDS" demo.
--
-- This mirrors the Kaggle yfinance crude-oil dump (CL=F daily bars), but with
-- a synthetic surrogate key so Glue JDBC bookmarks have something to track on.
--
-- Run order:
--   psql "$PGURL" -f oil_schema.sql
--   psql "$PGURL" -c "\copy public.crude_oil_daily(trade_ts,open,high,low,close,volume,ticker,name) FROM 'oil_data.csv' WITH (FORMAT csv, HEADER true)"

DROP TABLE IF EXISTS public.crude_oil_daily;

CREATE TABLE public.crude_oil_daily (
    id         BIGSERIAL PRIMARY KEY,
    trade_ts   TIMESTAMPTZ  NOT NULL,
    open       NUMERIC(12,4),
    high       NUMERIC(12,4),
    low        NUMERIC(12,4),
    close      NUMERIC(12,4),
    volume     BIGINT,
    ticker     VARCHAR(16)  NOT NULL,
    name       VARCHAR(64),
    -- High-watermark column for Glue JDBC bookmarks / incremental ingestion.
    -- Every INSERT/UPDATE refreshes this; Glue reads rows where
    -- loaded_at > last bookmark value.
    loaded_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    UNIQUE (trade_ts, ticker)
);

CREATE INDEX crude_oil_daily_trade_ts_idx  ON public.crude_oil_daily (trade_ts);
CREATE INDEX crude_oil_daily_ticker_idx    ON public.crude_oil_daily (ticker);
CREATE INDEX crude_oil_daily_loaded_at_idx ON public.crude_oil_daily (loaded_at);

-- Keep loaded_at fresh on UPDATE too (default only fires on INSERT).
CREATE OR REPLACE FUNCTION public.crude_oil_daily_touch_loaded_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.loaded_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER crude_oil_daily_loaded_at_trg
BEFORE UPDATE ON public.crude_oil_daily
FOR EACH ROW EXECUTE FUNCTION public.crude_oil_daily_touch_loaded_at();
