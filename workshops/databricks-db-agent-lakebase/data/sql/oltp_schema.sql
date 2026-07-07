-- Olist OLTP schema for Lakebase (Postgres).
-- Drop & recreate is intentional: this is a lab; production would migrate.
--
-- Run:
--   psql "$LAKEBASE_URL" -f data/sql/oltp_schema.sql

DROP TABLE IF EXISTS payments, order_items, orders, products, customers CASCADE;

CREATE TABLE customers (
    customer_id          TEXT PRIMARY KEY,
    customer_unique_id   TEXT NOT NULL,
    city                 TEXT,
    state                CHAR(2)
);

CREATE TABLE products (
    product_id           TEXT PRIMARY KEY,
    product_category     TEXT,
    product_weight       NUMERIC,
    product_length       NUMERIC,
    product_height       NUMERIC,
    product_width        NUMERIC
);

CREATE TABLE orders (
    order_id                     TEXT PRIMARY KEY,
    customer_id                  TEXT NOT NULL REFERENCES customers(customer_id),
    order_status                 TEXT NOT NULL,
    order_purchase_timestamp     TIMESTAMP NOT NULL,
    order_delivered_timestamp    TIMESTAMP
);
CREATE INDEX ix_orders_customer ON orders(customer_id);
CREATE INDEX ix_orders_purchase ON orders(order_purchase_timestamp);

CREATE TABLE order_items (
    order_id        TEXT NOT NULL REFERENCES orders(order_id),
    product_id      TEXT NOT NULL REFERENCES products(product_id),
    seller_id       TEXT,
    price           NUMERIC NOT NULL,
    freight_value   NUMERIC NOT NULL
);
CREATE INDEX ix_order_items_order   ON order_items(order_id);
CREATE INDEX ix_order_items_product ON order_items(product_id);

CREATE TABLE payments (
    order_id                TEXT NOT NULL REFERENCES orders(order_id),
    payment_type            TEXT NOT NULL,
    payment_value           NUMERIC NOT NULL,
    payment_installments    INTEGER NOT NULL
);
CREATE INDEX ix_payments_order ON payments(order_id);
