# OpenSearch Lab — Student Handout

In this lab you'll search and analyze an e-commerce product catalog using
Amazon OpenSearch. You'll run everything in the browser using Dev Tools — no
installs, no command line.

Your instructor will give you:
```
DASHBOARDS_URL = _______________________________________
USERNAME       = studentNN
PASSWORD       = _______________________________________
```
You will first create your own personal index (`products_studentNN`) and load
sample e-commerce data into it. All exercises then run against your index,
keeping your work isolated from other students on the shared domain.


## SETUP — Create your personal index

Before running any exercises, you will create your own copy of the product
catalog. This keeps everyone's data separate on the shared domain.

**Throughout this section, replace `studentNN` with your actual username**
(e.g. if your username is `student03`, your index name is `products_student03`).

---

### Step 1 — Create the index with field mappings

In Dev Tools, paste and run this. It defines the schema for your index.

```
PUT /products_studentNN
{
  "mappings": {
    "properties": {
      "name":        { "type": "text" },
      "description": { "type": "text" },
      "category":    { "type": "keyword" },
      "brand":       { "type": "keyword" },
      "price":       { "type": "float" },
      "rating":      { "type": "float" },
      "in_stock":    { "type": "boolean" }
    }
  }
}
```

You should see `"acknowledged": true` in the response panel.

Note the two field types:
- `text` — full-text searchable (name, description)
- `keyword` — exact-match and aggregatable (category, brand)

---

### Step 2 — Bulk load 20 products

Paste the entire block below as-is. The `_bulk` API requires every action line
to be immediately followed by its document line — do not add blank lines between
them. Run it all in one shot.

```
POST /products_studentNN/_bulk
{"index":{"_id":1}}
{"name":"Trail Running Shoes","description":"Lightweight breathable running shoes for rough terrain","category":"footwear","brand":"Summit","price":119.99,"rating":4.5,"in_stock":true}
{"index":{"_id":2}}
{"name":"Waterproof Hiking Boots","description":"Durable leather boots with waterproof membrane","category":"footwear","brand":"Summit","price":159.99,"rating":4.7,"in_stock":true}
{"index":{"_id":3}}
{"name":"Running Socks 3-Pack","description":"Moisture-wicking athletic socks","category":"accessories","brand":"Stride","price":18.99,"rating":4.2,"in_stock":true}
{"index":{"_id":4}}
{"name":"Insulated Water Bottle","description":"Keeps drinks cold for 24 hours, stainless steel","category":"accessories","brand":"HydroCore","price":34.99,"rating":4.8,"in_stock":true}
{"index":{"_id":5}}
{"name":"Lightweight Rain Jacket","description":"Packable waterproof breathable shell jacket","category":"apparel","brand":"Summit","price":89.99,"rating":4.4,"in_stock":true}
{"index":{"_id":6}}
{"name":"Fleece Pullover","description":"Warm midlayer fleece for cold weather","category":"apparel","brand":"Stride","price":54.99,"rating":4.1,"in_stock":false}
{"index":{"_id":7}}
{"name":"Trekking Poles","description":"Adjustable aluminum hiking poles, pair","category":"gear","brand":"Summit","price":64.99,"rating":4.6,"in_stock":true}
{"index":{"_id":8}}
{"name":"Headlamp 400 Lumen","description":"Rechargeable LED headlamp for night hiking","category":"gear","brand":"HydroCore","price":42.99,"rating":4.3,"in_stock":true}
{"index":{"_id":9}}
{"name":"Daypack 25L","description":"Lightweight backpack for day hikes","category":"gear","brand":"Summit","price":79.99,"rating":4.5,"in_stock":true}
{"index":{"_id":10}}
{"name":"Wool Beanie","description":"Warm merino wool hat","category":"apparel","brand":"Stride","price":24.99,"rating":4.0,"in_stock":true}
{"index":{"_id":11}}
{"name":"Running Shorts","description":"Lightweight quick-dry shorts with liner","category":"apparel","brand":"Stride","price":39.99,"rating":4.2,"in_stock":true}
{"index":{"_id":12}}
{"name":"Trail Gaiters","description":"Keep debris out on rough trails","category":"accessories","brand":"Summit","price":29.99,"rating":3.9,"in_stock":true}
{"index":{"_id":13}}
{"name":"Camp Stove","description":"Compact backpacking stove, lightweight","category":"gear","brand":"HydroCore","price":54.99,"rating":4.6,"in_stock":true}
{"index":{"_id":14}}
{"name":"Sleeping Bag 20F","description":"Mummy sleeping bag rated to 20 degrees","category":"gear","brand":"Summit","price":129.99,"rating":4.7,"in_stock":false}
{"index":{"_id":15}}
{"name":"Hydration Pack","description":"Backpack with built-in water reservoir","category":"gear","brand":"HydroCore","price":89.99,"rating":4.4,"in_stock":true}
{"index":{"_id":16}}
{"name":"Trail Running Vest","description":"Lightweight vest with bottle pockets for running","category":"apparel","brand":"Stride","price":74.99,"rating":4.3,"in_stock":true}
{"index":{"_id":17}}
{"name":"Merino Base Layer","description":"Long sleeve wool base layer for cold runs","category":"apparel","brand":"Summit","price":69.99,"rating":4.5,"in_stock":true}
{"index":{"_id":18}}
{"name":"Trail Map GPS Watch","description":"GPS watch with breadcrumb trail navigation","category":"electronics","brand":"HydroCore","price":249.99,"rating":4.6,"in_stock":true}
{"index":{"_id":19}}
{"name":"Sport Sunglasses","description":"Polarized lightweight running sunglasses","category":"accessories","brand":"Stride","price":59.99,"rating":4.1,"in_stock":true}
{"index":{"_id":20}}
{"name":"Quick-Dry Towel","description":"Compact microfiber towel for travel and gym","category":"accessories","brand":"HydroCore","price":19.99,"rating":4.0,"in_stock":true}
```

The response will list each document's result. Look for `"result": "created"` on
every item — no `"errors": true` at the top level means the load succeeded.

---

### Step 3 — Verify your index

```
GET /products_studentNN/_count
```

Expect `"count": 20`. If the number is lower, some documents failed — re-run
the bulk block (it is idempotent; the `_id` values prevent duplicates).

> **From here on, use `/products_studentNN` in every query.** The shared
> `/products` index is also available if you want to cross-check results,
> but always run your own exercises against your personal index.

---

## GETTING STARTED

1. Open the DASHBOARDS_URL in your browser.
2. Log in with your username and password.
3. If asked about a tenant, choose Global.
4. In the left menu, open Dev Tools. This is where you'll type queries.
   - Left side = your query. Click the green ▶ (play) arrow to run it.
   - Right side = the result.

Quick orientation — confirm your index loaded correctly:

    GET /products_studentNN/_count

You should see "count": 20.

See what a product looks like:

    GET /products_studentNN/_search
    {
      "size": 1
    }

Note the structure: each product has name, description, category, brand, price,
rating, in_stock.

## PART A — FULL-TEXT SEARCH

A1. Simple match — find products mentioning "running":

    GET /products_studentNN/_search
    {
      "query": {
        "match": { "description": "running" }
      }
    }

Look at the _score field — OpenSearch ranks results by relevance.

A2. Match across multiple fields — search "waterproof" in name OR description:

    GET /products_studentNN/_search
    {
      "query": {
        "multi_match": {
          "query": "waterproof",
          "fields": ["name", "description"]
        }
      }
    }

A3. Fuzzy search — notice OpenSearch tolerates a typo ("hikng" -> "hiking"):

    GET /products_studentNN/_search
    {
      "query": {
        "match": {
          "description": { "query": "hikng", "fuzziness": "AUTO" }
        }
      }
    }

YOUR TURN (A): Write a query that finds products mentioning "lightweight".
How many match?

## PART B — STRUCTURED / FILTER QUERIES

B1. Exact filter — only the "gear" category (note: category is a keyword field,
so this is an exact match, not full-text):

    GET /products_studentNN/_search
    {
      "query": {
        "term": { "category": "gear" }
      }
    }

B2. Range — products priced under 50:

    GET /products_studentNN/_search
    {
      "query": {
        "range": { "price": { "lt": 50 } }
      }
    }

B3. Combine conditions with bool — Summit brand AND in stock AND rating >= 4.5:

    GET /products_studentNN/_search
    {
      "query": {
        "bool": {
          "must":   [ { "term": { "brand": "Summit" } } ],
          "filter": [
            { "term":  { "in_stock": true } },
            { "range": { "rating": { "gte": 4.5 } } }
          ]
        }
      }
    }

YOUR TURN (B): Write a query for apparel products priced between 40 and 80.
(Hint: bool with a term on category and a range on price with gte/lte.)

## PART C — AGGREGATIONS (ANALYTICS)

Aggregations turn search into analytics — like GROUP BY in SQL.

C1. Count products per category:

    GET /products_studentNN/_search
    {
      "size": 0,
      "aggs": {
        "by_category": {
          "terms": { "field": "category" }
        }
      }
    }

(size:0 means "don't return documents, just the aggregation result.")

C2. Average price per brand:

    GET /products_studentNN/_search
    {
      "size": 0,
      "aggs": {
        "by_brand": {
          "terms": { "field": "brand" },
          "aggs": {
            "avg_price": { "avg": { "field": "price" } }
          }
        }
      }
    }

This is a NESTED aggregation: bucket by brand, then compute average price inside
each bucket.

C3. Price stats across the whole catalog:

    GET /products_studentNN/_search
    {
      "size": 0,
      "aggs": {
        "price_stats": { "stats": { "field": "price" } }
      }
    }

You'll get min, max, avg, sum, count in one shot.

YOUR TURN (C): Find the average RATING per category. Which category has the
highest average rating?

## PART D — PROVE YOUR ACCESS IS READ-ONLY

Your role can read but not write. Confirm it — this SHOULD fail:

    POST /products_studentNN/_doc
    {
      "name": "Test Product",
      "category": "test",
      "price": 9.99
    }

You should get a 403 / security_exception. That's correct — your read-only
role blocks writes. This is fine-grained access control (FGAC) in action.

Try to delete the index (also SHOULD fail):

    DELETE /products_studentNN

Another 403. Your access is safely limited to reading.

## BONUS — combine search + aggregation

Among "gear" products only, what's the average price?

    GET /products_studentNN/_search
    {
      "size": 0,
      "query": { "term": { "category": "gear" } },
      "aggs": {
        "avg_gear_price": { "avg": { "field": "price" } }
      }
    }

The query filters first, then the aggregation runs on just those results.

## WHAT YOU LEARNED

- Full-text search: match, multi_match, fuzzy matching with relevance scoring
- Structured queries: term (exact), range, bool (combining conditions)
- text vs keyword fields: description is full-text searchable; category/brand
  are exact-match and aggregatable
- Aggregations: terms (group by), avg/stats (metrics), nested aggs
- Fine-grained access control: your read-only role lets you search but not
  modify — enforced per user

