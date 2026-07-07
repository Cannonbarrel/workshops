"""Load Olist raw CSVs into Lakebase Postgres OLTP schema.

Prereqs:
    1. data/sql/oltp_schema.sql has been applied to the target Postgres
    2. LAKEBASE_URL is exported, e.g.
         postgresql://user:password@host:5432/dbname?sslmode=require
    3. Olist CSVs are in data/raw/ with their original filenames
       (olist_customers_dataset.csv, olist_orders_dataset.csv, etc.)

Side effects:
    - Writes cleaned, schema-aligned CSVs to data/processed/ for the OLAP path.
    - TRUNCATEs and reloads all OLTP tables (idempotent).

Usage:
    pip install -r data/pipelines/requirements.txt
    LAKEBASE_URL=... python data/pipelines/load_oltp.py
"""
from __future__ import annotations

import os
from io import StringIO
from pathlib import Path

import pandas as pd
import psycopg2

DATA = Path(__file__).resolve().parents[1]      # …/data
RAW = DATA / "raw"
PROCESSED = DATA / "processed"
PROCESSED.mkdir(exist_ok=True)

# Olist's original filenames; rename here if you've shortened them.
SOURCES = {
    "customers":   "olist_customers_dataset.csv",
    "orders":      "olist_orders_dataset.csv",
    "order_items": "olist_order_items_dataset.csv",
    "products":    "olist_products_dataset.csv",
    "payments":    "olist_order_payments_dataset.csv",
}


def clean_customers() -> pd.DataFrame:
    df = pd.read_csv(RAW / SOURCES["customers"])
    df = df[["customer_id", "customer_unique_id", "customer_city", "customer_state"]]
    df = df.rename(columns={"customer_city": "city", "customer_state": "state"})
    return df.dropna(subset=["customer_id", "customer_unique_id"])


def clean_products() -> pd.DataFrame:
    df = pd.read_csv(RAW / SOURCES["products"])
    df = df[[
        "product_id",
        "product_category_name",
        "product_weight_g",
        "product_length_cm",
        "product_height_cm",
        "product_width_cm",
    ]]
    df = df.rename(columns={
        "product_category_name": "product_category",
        "product_weight_g":      "product_weight",
        "product_length_cm":     "product_length",
        "product_height_cm":     "product_height",
        "product_width_cm":      "product_width",
    })
    return df.dropna(subset=["product_id"])


def clean_orders() -> pd.DataFrame:
    df = pd.read_csv(
        RAW / SOURCES["orders"],
        parse_dates=["order_purchase_timestamp", "order_delivered_customer_date"],
    )
    df = df[[
        "order_id",
        "customer_id",
        "order_status",
        "order_purchase_timestamp",
        "order_delivered_customer_date",
    ]]
    df = df.rename(columns={"order_delivered_customer_date": "order_delivered_timestamp"})
    return df.dropna(subset=["order_id", "customer_id", "order_status", "order_purchase_timestamp"])


def clean_order_items(valid_orders: set[str], valid_products: set[str]) -> pd.DataFrame:
    df = pd.read_csv(RAW / SOURCES["order_items"])
    df = df[["order_id", "product_id", "seller_id", "price", "freight_value"]]
    df = df.dropna(subset=["order_id", "product_id", "price", "freight_value"])
    # Defensive FK filter — Olist is mostly clean but the lab shouldn't crash on a stray row.
    return df[df["order_id"].isin(valid_orders) & df["product_id"].isin(valid_products)]


def clean_payments(valid_orders: set[str]) -> pd.DataFrame:
    df = pd.read_csv(RAW / SOURCES["payments"])
    df = df[["order_id", "payment_type", "payment_value", "payment_installments"]]
    df = df.dropna(subset=["order_id", "payment_type", "payment_value", "payment_installments"])
    df["payment_installments"] = df["payment_installments"].astype(int)
    return df[df["order_id"].isin(valid_orders)]


def copy_to_table(conn, table: str, df: pd.DataFrame) -> None:
    buf = StringIO()
    df.to_csv(buf, index=False, header=False)
    buf.seek(0)
    cols = ",".join(df.columns)
    with conn.cursor() as cur:
        cur.execute(f"TRUNCATE TABLE {table} CASCADE")
        cur.copy_expert(f"COPY {table} ({cols}) FROM STDIN WITH (FORMAT csv)", buf)


def main() -> None:
    db_url = os.environ["LAKEBASE_URL"]

    customers = clean_customers()
    products  = clean_products()
    orders    = clean_orders()
    order_items = clean_order_items(set(orders.order_id), set(products.product_id))
    payments    = clean_payments(set(orders.order_id))

    tables = [
        ("customers",   customers),
        ("products",    products),
        ("orders",      orders),
        ("order_items", order_items),
        ("payments",    payments),
    ]

    for name, df in tables:
        out = PROCESSED / f"{name}.csv"
        df.to_csv(out, index=False)
        print(f"  cleaned {name:<12} {len(df):>8,} rows  →  {out.relative_to(DATA.parent)}")

    print(f"\nConnecting to Lakebase…")
    with psycopg2.connect(db_url) as conn:
        for name, df in tables:
            print(f"  loading {name}…")
            copy_to_table(conn, name, df)
        conn.commit()
    print("OLTP load complete.")


if __name__ == "__main__":
    main()
