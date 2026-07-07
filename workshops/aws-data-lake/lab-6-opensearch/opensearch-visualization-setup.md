# OpenSearch Dashboard — Build-Along Instructions (Instructor Copy)

Read these aloud / share your screen while students follow along. Everyone is a
full admin, so each student builds their own copy on the shared `products` data.

Pacing: ~20-25 min. Each section is a checkpoint — wait for the room before
moving on.

PREREQUISITE: the `products` index is loaded (20 docs). If not, run the _bulk
load block from the instructor setup guide first.

NOTE FOR THE ROOM: Everyone shares one domain. When you create the index
pattern and visualizations, give them slightly unique names if you want to avoid
overwriting each other (e.g. add your initials). For a synchronized follow-along
it's fine to use the same names — just know the last save wins on shared objects.

## STEP 1 — Create the index pattern (everyone does this)

Dashboards needs an "index pattern" (a.k.a. data view) to visualize an index.

1. Top-left hamburger menu -> Stack Management (under Management).
2. Click Index Patterns (or "Data Views" in newer versions).
3. Click Create index pattern.
4. Name/pattern: type  products
   - It should show "Your index pattern matches 1 source: products".
5. Next step.
6. Time field: choose "I don't want to use a time filter"
   (our product data has no timestamp).
7. Create index pattern.

CHECKPOINT: everyone sees the products fields listed (name, category, price...).

## STEP 2 — Explore in Discover (warm-up, no building yet)

1. Menu -> Discover.
2. Top-left dropdown: select the  products  index pattern.
3. You should see all 20 products.
4. Try these in the search bar (press Enter after each):
     category:footwear
     price > 100
     brand:Summit and in_stock:true
5. On the left field list, click  category  -> see top values breakdown.

TEACHING LINE: "Discover runs real OpenSearch queries — this is search before we
turn it into charts."

CHECKPOINT: everyone can filter and see results change.

## STEP 3 — Visualization 1: a big number (Metric)

A single big number anchors the dashboard.

1. Menu -> Visualize -> Create visualization.
2. Pick  Metric.
3. Source:  products.
4. Metric defaults to Count -> you'll see "20".
5. Save (top bar) as:  Total Products

## STEP 4 — Visualization 2: bar chart, count per category

1. Visualize -> Create visualization -> Vertical Bar -> source products.
2. Y-axis: leave metric as  Count.
3. Buckets -> Add -> X-axis.
   - Aggregation:  Terms
   - Field:  category
   - Size:  10
4. Click  Update  (bottom right).
5. You now see a bar per category.
6. Save as:  Products by Category

## STEP 5 — Visualization 3: bar chart, average price per brand

1. Visualize -> Create visualization -> Vertical Bar -> source products.
2. Y-axis metric: change from Count to  Average  -> Field:  price.
3. Buckets -> Add -> X-axis -> Terms -> Field:  brand -> Update.
4. Save as:  Avg Price by Brand

TEACHING LINE: "This bar chart is the same average aggregation you ran in Dev
Tools — the UI is just a friendly face on Query DSL."

## STEP 6 — Visualization 4: pie, products by category

1. Visualize -> Create visualization -> Pie -> source products.
2. Metric:  Count.
3. Buckets -> Add -> Split slices -> Terms -> Field:  category -> Size 10 -> Update.
4. (Optional polish) Options tab -> toggle Donut on, Show labels on.
5. Save as:  Category Share

## STEP 7 — Visualization 5: pie, in stock vs out of stock

1. Visualize -> Create visualization -> Pie -> source products.
2. Metric:  Count.
3. Buckets -> Split slices -> Terms -> Field:  in_stock -> Update.
   (Two slices: true / false.)
4. Save as:  Stock Status

## STEP 8 — Visualization 6: pie, inventory VALUE by category

Shows dollar value share, not item count — a different story.

1. Visualize -> Create visualization -> Pie -> source products.
2. Metric: change from Count to  Sum  -> Field:  price.
3. Buckets -> Split slices -> Terms -> Field:  category -> Update.
4. Save as:  Value by Category

TEACHING LINE: "Compare this to Category Share — a category can have few items
but high total value. Count vs value tell different stories."

## STEP 9 — Assemble the dashboard

1. Menu -> Dashboard -> Create dashboard.
2. Click  Add  (top bar) -> a panel list appears.
3. Click each saved visualization to add it:
     Total Products
     Products by Category
     Avg Price by Brand
     Category Share
     Stock Status
     Value by Category
4. Close the Add panel. Drag/resize panels into a grid. Suggested layout:
     Row 1:  Total Products (small)  |  Products by Category (wide)
     Row 2:  Category Share  |  Value by Category
     Row 3:  Stock Status   |  Avg Price by Brand
5. Save (top bar) as:  Product Catalog Overview
   (Tick "Store time with dashboard" is irrelevant here — no time field.)

CHECKPOINT: everyone has a 6-panel dashboard.

## STEP 10 — The "wow": one filter updates everything

1. On the dashboard, click  Add filter  (top left).
2. Field:  in_stock   Operator:  is   Value:  true
3. Save the filter.
4. WATCH: every panel recalculates to in-stock products only — counts drop,
   pies re-slice, the big number changes.
5. Remove the filter to restore.

TEACHING LINE: "One filter at the top re-runs every visualization at once. That's
the difference between a dashboard and a static report."

## STEP 11 — Tie it back to the engine

Menu -> Dev Tools. Run:

    GET /products/_search
    {
      "size": 0,
      "aggs": { "by_category": { "terms": { "field": "category" } } }
    }

Point out: "The Category Share pie and Products by Category bar both ran exactly
this aggregation. Every chart on the dashboard is an OpenSearch query underneath."

## RECAP FOR STUDENTS

- Index pattern: how Dashboards knows which index to visualize.
- Discover: interactive search/explore.
- Visualizations: bars (comparisons), pies (proportions), metric (one number).
- Aggregations power every chart: terms = group by, avg/sum = metrics.
- Dashboard: assemble panels; a single filter drives them all together.
- It's all Query DSL underneath — the UI just builds the queries for you.

## IF SOMETHING BREAKS MID-SESSION

- "No index pattern" / charts empty -> someone needs to finish Step 1.
- products index missing (someone deleted it) -> re-run the _bulk load block
  from the setup guide; everyone refresh.
- A field won't aggregate (e.g. can't pick it in Terms) -> it's a text field;
  use the keyword version. category/brand/in_stock are keyword/boolean and
  aggregate fine; name/description are text (full-text only).
- Saved object name clash -> add initials to the name and re-save.