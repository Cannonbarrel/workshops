# Redshift Load Generation Lab — Session Runbook

Generate sustained load on a **provisioned Redshift cluster** using the
`sample_data_dev.tickit` sample dataset, so that CloudWatch metrics
(`CPUUtilization`, query duration, `WLMQueueLength`) move enough for a Lab 1
alarm to fire.

Run the steps **in order**. Several steps have a **CHECKPOINT** — stop, read the
result, and only continue if it matches. Do not paste the whole file at once.

---

## Before you start — three things that will bite you

1. **It's TICKIT, tiny by default.** Stock `sales` is ~172K rows and finishes in
   milliseconds. No alarm fires against it. That's why Stage 1 inflates it first.
2. **`generate_series` does NOT work here.** On this cluster it returns
   `Function "generate_series(integer,integer)" not supported` because it only
   runs on the leader node and can't drive a distributed CROSS JOIN. This runbook
   uses a **numbers table** built from a real table instead. Do not try to
   "fix" it back to generate_series.
3. **You must write to a WRITABLE database/schema.** `sample_data_dev` is
   read-only sample data. Read FROM it with the 3-part name
   `"sample_data_dev"."tickit"."sales"`, but CREATE your tables in your own
   database (examples below use a schema called `loadtest`). If
   `CREATE SCHEMA loadtest` errors, you're connected to the read-only sample DB —
   reconnect to your writable database first.

4. **Metrics are ~1-minute granularity and alarms need SUSTAINED load.** A query
   that spikes CPU for 10 seconds may never register as a datapoint. To make an
   alarm fire you must keep the cluster hot for several minutes (Stage 4).

---

## STAGE 0 — Create the numbers table (replaces generate_series)

We need a small multiplier table (500 rows) to inflate TICKIT. Built from an
existing table so it runs on compute nodes without `generate_series`.

```sql
CREATE SCHEMA IF NOT EXISTS loadtest;

DROP TABLE IF EXISTS loadtest.numbers;
CREATE TABLE loadtest.numbers AS
SELECT ROW_NUMBER() OVER () AS n
FROM "sample_data_dev"."tickit"."sales"
LIMIT 500;
```

**CHECKPOINT 0** — confirm exactly 500 rows:

```sql
SELECT COUNT(*) AS should_be_500 FROM loadtest.numbers;
```

- Returns **500** → continue to Stage 1.
- `CREATE SCHEMA` errors (permission / read-only) → you're on the read-only
  sample DB. Reconnect to your writable database and rerun Stage 0.

---

## STAGE 1 — Inflate sales (~500x → ~86M rows)

Cross-join stock sales (~172K) against the 500-row numbers table.

```sql
DROP TABLE IF EXISTS loadtest.big_sales;
CREATE TABLE loadtest.big_sales AS
SELECT
    s.salesid,
    s.listid,
    s.sellerid,
    s.buyerid,
    s.eventid,
    s.dateid,
    s.qtysold,
    s.pricepaid,
    s.commission,
    s.saletime,
    n.n AS replica_seq
FROM "sample_data_dev"."tickit"."sales" s
CROSS JOIN loadtest.numbers n;
```

**CHECKPOINT 1** — confirm size and note the runtime:

```sql
SELECT COUNT(*) AS row_count FROM loadtest.big_sales;   -- expect ~86,000,000
```

- ~86M rows, CTAS took a few seconds → **good, proceed to Stage 2.**
- Ran very long, filled disk, or errored → 500x is too aggressive for this node
  type. Rebuild smaller: rerun Stage 0 with `LIMIT 100` (or `200`), then rerun
  Stage 1. Smaller numbers table = smaller big_sales = less load.

### (Optional) second big table for redistribution-forcing joins

Only needed if you want Burner C (heavier network + CPU load). Distributed EVEN
so joining it to big_sales forces a redistribution.

```sql
DROP TABLE IF EXISTS loadtest.big_listing;
CREATE TABLE loadtest.big_listing DISTSTYLE EVEN AS
SELECT
    l.listid,
    l.sellerid,
    l.eventid,
    l.numtickets,
    l.priceperticket,
    n.n AS replica_seq
FROM "sample_data_dev"."tickit"."listing" l
CROSS JOIN loadtest.numbers n;
```

---

## STAGE 2 — Burner queries (spike CPU + query duration)

These read your inflated table (2-part name `loadtest.big_sales` — no cross-DB
hop). Run any of them; run repeatedly to sustain. Start with A; only use B once
you know the cluster can take it.

**Burner A — big aggregation (CPU + duration). Safe starting point.**
```sql
SELECT b.eventid, b.dateid,
       COUNT(*)            AS txns,
       SUM(b.qtysold)      AS tickets,
       SUM(b.pricepaid)    AS revenue,
       AVG(b.commission)   AS avg_comm,
       STDDEV(b.pricepaid) AS price_stddev
FROM loadtest.big_sales b
GROUP BY b.eventid, b.dateid
ORDER BY revenue DESC;
```

**Burner B — self-join row explosion (heavy CPU, may spill to disk). Use with
care; can run for minutes on 500x.**
```sql
SELECT a.eventid, COUNT(*) AS pair_count,
       SUM(a.pricepaid + b.pricepaid) AS combined
FROM loadtest.big_sales a
JOIN loadtest.big_sales b
  ON a.eventid = b.eventid AND a.dateid = b.dateid
GROUP BY a.eventid
ORDER BY pair_count DESC
LIMIT 100;
```

**Burner C — redistribution-forcing join (network + CPU). Needs big_listing.**
```sql
SELECT s.eventid,
       SUM(s.pricepaid)          AS revenue,
       SUM(l.numtickets)         AS tickets_listed,
       COUNT(DISTINCT s.buyerid) AS unique_buyers
FROM loadtest.big_sales s
JOIN loadtest.big_listing l ON s.listid = l.listid
GROUP BY s.eventid
ORDER BY revenue DESC;
```

**Burner D — window functions over the whole table (sort-heavy, CPU + memory).**
```sql
SELECT eventid, dateid, pricepaid,
       SUM(pricepaid) OVER (PARTITION BY eventid ORDER BY dateid
                            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_rev,
       RANK()   OVER (PARTITION BY eventid ORDER BY pricepaid DESC) AS price_rank,
       NTILE(100) OVER (ORDER BY pricepaid)                         AS pct_bucket
FROM loadtest.big_sales;
```

---

## STAGE 3 — Fill the WLM queue (`WLMQueueLength`)

A single session CANNOT fill a queue — you need more concurrent queries than WLM
slots. Two options:

**Option A — classroom manual:** open 6–8 query-editor tabs (or have 6–8 students
each run Burner A) and hit run at the same moment.

**Option B — scripted (psql):**
```bash
for i in $(seq 1 8); do
  psql "host=<ENDPOINT> port=5439 dbname=<DB> user=<USER> sslmode=require" \
    -c "SELECT b.eventid, COUNT(*), SUM(b.pricepaid) FROM loadtest.big_sales b GROUP BY b.eventid ORDER BY 3 DESC;" &
done
wait
```

**IMPORTANT:** if **concurrency scaling** is ON (Auto WLM), Redshift adds burst
capacity and the queue may NOT grow — that's concurrency scaling doing its job.
To see queuing, use a **manual WLM queue with 2–3 slots** so 8 concurrent
queries visibly back up. This is a good teaching moment, not a failure.

**CHECKPOINT 3** — is anything actually queuing?
```sql
SELECT service_class, num_queued_queries, num_executing_queries
FROM stv_wlm_service_class_state
WHERE num_queued_queries > 0 OR num_executing_queries > 0;
```
`num_queued_queries > 0` → your `WLMQueueLength` CloudWatch metric will rise.

---

## STAGE 4 — Sustain load so the alarm fires (~10 minutes)

One burner finishes before CloudWatch samples it. Keep the cluster hot so
`CPUUtilization` stays elevated across multiple 1-minute datapoints.

```bash
END=$((SECONDS+600))   # 10 minutes
while [ $SECONDS -lt $END ]; do
  psql "host=<ENDPOINT> port=5439 dbname=<DB> user=<USER> sslmode=require" \
    -c "SELECT a.eventid, COUNT(*) FROM loadtest.big_sales a JOIN loadtest.big_sales b ON a.eventid=b.eventid AND a.dateid=b.dateid GROUP BY a.eventid;" \
    >/dev/null 2>&1
done
```

Run this alongside the Stage 3 burst. With an alarm like
`CPUUtilization > 70% for 3 consecutive 1-minute periods`, it should transition
to ALARM within a few minutes.

---

## WATCH IT MOVE (put on screen next to the CloudWatch dashboard)

```sql
-- Running queries and how long they've been going
SELECT pid, user_name, starttime,
       DATEDIFF(second, starttime, GETDATE()) AS run_seconds,
       SUBSTRING(query, 1, 60) AS query_snippet
FROM stv_recents
WHERE status = 'Running';
```

```sql
-- WLM queue state
SELECT service_class, num_queued_queries, num_executing_queries
FROM stv_wlm_service_class_state
WHERE num_queued_queries > 0 OR num_executing_queries > 0;
```

---

## CLEANUP (do this when the lab ends)

The inflated tables consume disk, and `PercentageDiskSpaceUsed` is itself an
alarm metric — leaving them skews the next run.

```sql
DROP TABLE IF EXISTS loadtest.big_sales;
DROP TABLE IF EXISTS loadtest.big_listing;
DROP TABLE IF EXISTS loadtest.numbers;
DROP SCHEMA IF EXISTS loadtest;
```

---

## Quick troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `generate_series ... not supported` | Leader-only function | Use the Stage 0 numbers table (already the default here) |
| `CREATE SCHEMA` / `CREATE TABLE` permission error | Connected to read-only `sample_data_dev` | Reconnect to your writable database; read sample via 3-part name |
| Cross-DB read from `sample_data_dev` fails | Cross-database query not enabled | Enable it, or COPY TICKIT into your own DB first |
| big_sales CTAS runs forever / fills disk | 500x too big for node type | Rebuild Stage 0 with LIMIT 100–200, rerun Stage 1 |
| CPU spikes but alarm never fires | Load not sustained across datapoints | Run Stage 4 sustain loop for the full ~10 min |
| WLMQueueLength stays 0 under concurrency | Concurrency scaling absorbing the burst | Use a manual WLM queue with 2–3 slots |

---

## Fill-in-the-blanks before the session

- `<ENDPOINT>` — cluster endpoint (host)
- `<DB>` — your **writable** database name
- `<USER>` — your Redshift user
- Target schema — this runbook uses `loadtest`; change if needed
- Inflation factor — Stage 0 `LIMIT` (500 default; lower for smaller clusters)