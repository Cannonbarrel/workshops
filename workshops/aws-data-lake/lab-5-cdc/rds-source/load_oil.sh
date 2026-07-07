#!/bin/bash
# Load oil_data.csv into a regular RDS Postgres instance for the LF
# "ingest from RDS" demo.
#
# Matches the connection pattern:
#   psql "host=$RDSHOST port=5432 dbname=postgres user=postgres \
#         sslmode=verify-full sslrootcert=./global-bundle.pem"
#
# Steps:
#   1. Connect to the default `postgres` DB and CREATE DATABASE if missing.
#   2. Connect to the target DB, run schema DDL, \copy the CSV, then COUNT(*).
#
# Usage:
#   export RDSHOST=<your-rds-endpoint>.us-west-2.rds.amazonaws.com
#   export PGPASSWORD='<your-postgres-password>'   # optional; prompted if unset
#   ./load_oil.sh
#
# Optional overrides:
#   DBUSER (default postgres), DBNAME (default oil), PORT (default 5432),
#   PGSSLROOTCERT (default ./global-bundle.pem next to this script)
#
# The RDS root cert bundle is required for sslmode=verify-full. If
# global-bundle.pem isn't already next to this script, the loader will
# download it from https://truststore.pki.rds.amazonaws.com.

set -euo pipefail

: "${RDSHOST:?set RDSHOST=<rds endpoint>}"
DBUSER="${DBUSER:-postgres}"
DBNAME="${DBNAME:-oil}"
PORT="${PORT:-5432}"

HERE="$(cd "$(dirname "$0")" && pwd)"
PGSSLROOTCERT="${PGSSLROOTCERT:-$HERE/global-bundle.pem}"

if [[ ! -f "$PGSSLROOTCERT" ]]; then
  echo "[setup] downloading AWS RDS global root cert bundle..."
  curl -fsSL -o "$PGSSLROOTCERT" \
    https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem
fi

if [[ -z "${PGPASSWORD:-}" ]]; then
  read -s -p "Password for $DBUSER@$RDSHOST: " PGPASSWORD
  echo
fi
export PGPASSWORD

SSL_OPTS="sslmode=verify-full sslrootcert=$PGSSLROOTCERT"
ADMIN_CONN="host=$RDSHOST port=$PORT dbname=postgres user=$DBUSER $SSL_OPTS"
TARGET_CONN="host=$RDSHOST port=$PORT dbname=$DBNAME user=$DBUSER $SSL_OPTS"

echo "[1/4] ensuring database '$DBNAME' exists..."
psql "$ADMIN_CONN" -v ON_ERROR_STOP=1 <<SQL
SELECT 'CREATE DATABASE $DBNAME'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DBNAME')\gexec
SQL

echo "[2/4] applying schema..."
psql "$TARGET_CONN" -v ON_ERROR_STOP=1 -f "$HERE/oil_schema.sql"

echo "[3/4] \\copy-ing oil_data.csv..."
psql "$TARGET_CONN" -v ON_ERROR_STOP=1 -c \
  "\copy public.crude_oil_daily(trade_ts,open,high,low,close,volume,ticker,name) FROM '$HERE/oil_data.csv' WITH (FORMAT csv, HEADER true)"

echo "[4/4] sanity check..."
psql "$TARGET_CONN" -v ON_ERROR_STOP=1 -c "
SELECT COUNT(*) AS rows,
       MIN(trade_ts)::date AS first_day,
       MAX(trade_ts)::date AS last_day
FROM public.crude_oil_daily;
"
