"""
Convert the Kaggle crude-oil yfinance CSV into a Postgres-COPY-ready CSV.

Source row shape:
    "Date","Open","High","Low","Close","Volume","ticker","name"
    "2000-08-23 00:00:00-04:00","31.950000762939453",...,"79385","CL=F","Crude Oil Futures (CL=F)"

Output row shape (column order matches the \\copy column list in oil_schema.sql):
    trade_ts,open,high,low,close,volume,ticker,name
    2000-08-23 00:00:00-04,31.9500,32.8000,31.9500,32.0500,79385,CL=F,Crude Oil Futures (CL=F)

Why we touch the data at all:
  - The float64 noise (31.950000762939453) blows past NUMERIC(12,4) — round to 4.
  - Postgres `timestamptz` parses "YYYY-MM-DD HH:MM:SS-04" cleanly; the trailing
    ":00" in "-04:00" also parses, but we trim it so the CSV is identical to
    what `to_char(trade_ts, 'YYYY-MM-DD HH24:MI:SSOF')` will round-trip to.
  - Drop any row missing a date, close, or volume (matches the Glue job's
    cleanup so RDS-sourced data and S3-sourced data end up with the same row
    count).

Run:
    python3 prep_oil_for_postgres.py \\
        --source /Users/kchandan/Documents/bcr/training/Crude_Oil_historical_data.csv \\
        --target oil_data.csv
"""

import argparse
import csv
import sys
from pathlib import Path


def clean_ts(raw):
    # "2000-08-23 00:00:00-04:00" → "2000-08-23 00:00:00-04"
    raw = raw.strip()
    if not raw:
        return ""
    # Drop the final ":00" of the offset if present.
    if len(raw) >= 3 and raw[-3] == ":":
        raw = raw[:-3]
    return raw


def clean_num(raw: str, decimals: int = 4) -> str:
    raw = raw.strip()
    if raw == "" or raw.lower() == "nan":
        return ""
    return f"{float(raw):.{decimals}f}"


def clean_int(raw: str) -> str:
    raw = raw.strip()
    if raw == "" or raw.lower() == "nan":
        return ""
    return str(int(float(raw)))


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", required=True, type=Path)
    ap.add_argument("--target", required=True, type=Path)
    args = ap.parse_args()

    if not args.source.is_file():
        print(f"source not found: {args.source}", file=sys.stderr)
        return 1

    kept = 0
    dropped = 0

    with args.source.open(newline="", encoding="utf-8") as fin, \
            args.target.open("w", newline="", encoding="utf-8") as fout:
        reader = csv.DictReader(fin)
        writer = csv.writer(fout, quoting=csv.QUOTE_MINIMAL)
        writer.writerow([
            "trade_ts", "open", "high", "low", "close", "volume", "ticker", "name",
        ])

        for row in reader:
            trade_ts = clean_ts(row["Date"])
            close = clean_num(row["Close"])
            volume = clean_int(row["Volume"])
            if not trade_ts or not close or not volume:
                dropped += 1
                continue

            writer.writerow([
                trade_ts,
                clean_num(row["Open"]),
                clean_num(row["High"]),
                clean_num(row["Low"]),
                close,
                volume,
                row["ticker"].strip(),
                row["name"].strip(),
            ])
            kept += 1

    print(f"wrote {kept} rows ({dropped} dropped) to {args.target}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
