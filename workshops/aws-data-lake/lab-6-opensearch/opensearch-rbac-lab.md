# OpenSearch RBAC Lab — Index-Level Access Control

In this lab you will build a realistic fine-grained access control model for an
e-commerce platform. Three departments need access to the same OpenSearch domain
but must be isolated from each other's data.

You will create roles, users, and role mappings entirely through the OpenSearch
Security API in Dev Tools. All commands run as your admin user.

---

## Business scenario

The platform has three indices and three teams:

| Index | Contents | Who needs access |
|---|---|---|
| `store_products` | Product catalog — 20 items | Everyone (read) |
| `store_orders` | Customer orders — 10 records | Order management only |
| `store_inventory` | Stock levels — 20 records | Inventory team (read + write) |

**The three personas:**

| User | Role | Can read | Can write | Cannot touch |
|---|---|---|---|---|
| `catalog_user` | `catalog_reader_role` | `store_products` (in-stock only) | — | `store_orders`, `store_inventory`, price field hidden |
| `order_user` | `order_analyst_role` | `store_products`, `store_orders` | — | `store_inventory` |
| `inventory_user` | `inventory_manager_role` | `store_products`, `store_inventory` | `store_inventory` | `store_orders` |

---

## PART 1 — Create the indices and load data

Run all commands in Dev Tools as your admin user.

### 1A — store_products index

```
PUT /store_products
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

```
POST /store_products/_bulk
{"index":{"_id":1}}
{"name":"Trail Running Shoes","description":"Lightweight breathable running shoes","category":"footwear","brand":"Summit","price":119.99,"rating":4.5,"in_stock":true}
{"index":{"_id":2}}
{"name":"Waterproof Hiking Boots","description":"Durable boots with waterproof membrane","category":"footwear","brand":"Summit","price":159.99,"rating":4.7,"in_stock":true}
{"index":{"_id":3}}
{"name":"Running Socks 3-Pack","description":"Moisture-wicking athletic socks","category":"accessories","brand":"Stride","price":18.99,"rating":4.2,"in_stock":true}
{"index":{"_id":4}}
{"name":"Insulated Water Bottle","description":"Keeps drinks cold for 24 hours","category":"accessories","brand":"HydroCore","price":34.99,"rating":4.8,"in_stock":true}
{"index":{"_id":5}}
{"name":"Lightweight Rain Jacket","description":"Packable waterproof shell jacket","category":"apparel","brand":"Summit","price":89.99,"rating":4.4,"in_stock":true}
{"index":{"_id":6}}
{"name":"Fleece Pullover","description":"Warm midlayer fleece for cold weather","category":"apparel","brand":"Stride","price":54.99,"rating":4.1,"in_stock":false}
{"index":{"_id":7}}
{"name":"Trekking Poles","description":"Adjustable aluminum hiking poles","category":"gear","brand":"Summit","price":64.99,"rating":4.6,"in_stock":true}
{"index":{"_id":8}}
{"name":"Headlamp 400 Lumen","description":"Rechargeable LED headlamp","category":"gear","brand":"HydroCore","price":42.99,"rating":4.3,"in_stock":true}
{"index":{"_id":9}}
{"name":"Daypack 25L","description":"Lightweight backpack for day hikes","category":"gear","brand":"Summit","price":79.99,"rating":4.5,"in_stock":true}
{"index":{"_id":10}}
{"name":"Wool Beanie","description":"Warm merino wool hat","category":"apparel","brand":"Stride","price":24.99,"rating":4.0,"in_stock":true}
{"index":{"_id":11}}
{"name":"Running Shorts","description":"Lightweight quick-dry shorts","category":"apparel","brand":"Stride","price":39.99,"rating":4.2,"in_stock":true}
{"index":{"_id":12}}
{"name":"Trail Gaiters","description":"Keep debris out on rough trails","category":"accessories","brand":"Summit","price":29.99,"rating":3.9,"in_stock":true}
{"index":{"_id":13}}
{"name":"Camp Stove","description":"Compact backpacking stove","category":"gear","brand":"HydroCore","price":54.99,"rating":4.6,"in_stock":true}
{"index":{"_id":14}}
{"name":"Sleeping Bag 20F","description":"Mummy sleeping bag rated to 20 degrees","category":"gear","brand":"Summit","price":129.99,"rating":4.7,"in_stock":false}
{"index":{"_id":15}}
{"name":"Hydration Pack","description":"Backpack with built-in water reservoir","category":"gear","brand":"HydroCore","price":89.99,"rating":4.4,"in_stock":true}
{"index":{"_id":16}}
{"name":"Trail Running Vest","description":"Lightweight vest with bottle pockets","category":"apparel","brand":"Stride","price":74.99,"rating":4.3,"in_stock":true}
{"index":{"_id":17}}
{"name":"Merino Base Layer","description":"Long sleeve wool base layer","category":"apparel","brand":"Summit","price":69.99,"rating":4.5,"in_stock":true}
{"index":{"_id":18}}
{"name":"Trail Map GPS Watch","description":"GPS watch with breadcrumb navigation","category":"electronics","brand":"HydroCore","price":249.99,"rating":4.6,"in_stock":true}
{"index":{"_id":19}}
{"name":"Sport Sunglasses","description":"Polarized lightweight sunglasses","category":"accessories","brand":"Stride","price":59.99,"rating":4.1,"in_stock":true}
{"index":{"_id":20}}
{"name":"Quick-Dry Towel","description":"Compact microfiber towel","category":"accessories","brand":"HydroCore","price":19.99,"rating":4.0,"in_stock":true}
```

Verify: `GET /store_products/_count` → expect 20.

---

### 1B — store_orders index

```
PUT /store_orders
{
  "mappings": {
    "properties": {
      "order_id":    { "type": "keyword" },
      "customer":    { "type": "keyword" },
      "product_id":  { "type": "integer" },
      "quantity":    { "type": "integer" },
      "total":       { "type": "float" },
      "status":      { "type": "keyword" },
      "order_date":  { "type": "date" }
    }
  }
}
```

```
POST /store_orders/_bulk
{"index":{"_id":"ORD-001"}}
{"order_id":"ORD-001","customer":"alice","product_id":1,"quantity":1,"total":119.99,"status":"shipped","order_date":"2024-11-01"}
{"index":{"_id":"ORD-002"}}
{"order_id":"ORD-002","customer":"bob","product_id":4,"quantity":2,"total":69.98,"status":"delivered","order_date":"2024-11-02"}
{"index":{"_id":"ORD-003"}}
{"order_id":"ORD-003","customer":"carol","product_id":9,"quantity":1,"total":79.99,"status":"processing","order_date":"2024-11-03"}
{"index":{"_id":"ORD-004"}}
{"order_id":"ORD-004","customer":"david","product_id":2,"quantity":1,"total":159.99,"status":"shipped","order_date":"2024-11-04"}
{"index":{"_id":"ORD-005"}}
{"order_id":"ORD-005","customer":"eve","product_id":18,"quantity":1,"total":249.99,"status":"delivered","order_date":"2024-11-05"}
{"index":{"_id":"ORD-006"}}
{"order_id":"ORD-006","customer":"frank","product_id":7,"quantity":2,"total":129.98,"status":"processing","order_date":"2024-11-06"}
{"index":{"_id":"ORD-007"}}
{"order_id":"ORD-007","customer":"grace","product_id":15,"quantity":1,"total":89.99,"status":"shipped","order_date":"2024-11-07"}
{"index":{"_id":"ORD-008"}}
{"order_id":"ORD-008","customer":"henry","product_id":5,"quantity":1,"total":89.99,"status":"delivered","order_date":"2024-11-08"}
{"index":{"_id":"ORD-009"}}
{"order_id":"ORD-009","customer":"iris","product_id":13,"quantity":3,"total":164.97,"status":"processing","order_date":"2024-11-09"}
{"index":{"_id":"ORD-010"}}
{"order_id":"ORD-010","customer":"jack","product_id":8,"quantity":2,"total":85.98,"status":"shipped","order_date":"2024-11-10"}
```

Verify: `GET /store_orders/_count` → expect 10.

---

### 1C — store_inventory index

```
PUT /store_inventory
{
  "mappings": {
    "properties": {
      "product_id":      { "type": "integer" },
      "product_name":    { "type": "keyword" },
      "warehouse":       { "type": "keyword" },
      "quantity_on_hand":{ "type": "integer" },
      "reorder_point":   { "type": "integer" },
      "last_updated":    { "type": "date" }
    }
  }
}
```

```
POST /store_inventory/_bulk
{"index":{"_id":1}}
{"product_id":1,"product_name":"Trail Running Shoes","warehouse":"WH-WEST","quantity_on_hand":142,"reorder_point":20,"last_updated":"2024-11-10"}
{"index":{"_id":2}}
{"product_id":2,"product_name":"Waterproof Hiking Boots","warehouse":"WH-WEST","quantity_on_hand":88,"reorder_point":15,"last_updated":"2024-11-10"}
{"index":{"_id":3}}
{"product_id":3,"product_name":"Running Socks 3-Pack","warehouse":"WH-CENTRAL","quantity_on_hand":430,"reorder_point":50,"last_updated":"2024-11-10"}
{"index":{"_id":4}}
{"product_id":4,"product_name":"Insulated Water Bottle","warehouse":"WH-CENTRAL","quantity_on_hand":215,"reorder_point":30,"last_updated":"2024-11-10"}
{"index":{"_id":5}}
{"product_id":5,"product_name":"Lightweight Rain Jacket","warehouse":"WH-WEST","quantity_on_hand":67,"reorder_point":10,"last_updated":"2024-11-10"}
{"index":{"_id":6}}
{"product_id":6,"product_name":"Fleece Pullover","warehouse":"WH-CENTRAL","quantity_on_hand":0,"reorder_point":10,"last_updated":"2024-11-10"}
{"index":{"_id":7}}
{"product_id":7,"product_name":"Trekking Poles","warehouse":"WH-WEST","quantity_on_hand":54,"reorder_point":10,"last_updated":"2024-11-10"}
{"index":{"_id":8}}
{"product_id":8,"product_name":"Headlamp 400 Lumen","warehouse":"WH-CENTRAL","quantity_on_hand":198,"reorder_point":25,"last_updated":"2024-11-10"}
{"index":{"_id":9}}
{"product_id":9,"product_name":"Daypack 25L","warehouse":"WH-WEST","quantity_on_hand":73,"reorder_point":10,"last_updated":"2024-11-10"}
{"index":{"_id":10}}
{"product_id":10,"product_name":"Wool Beanie","warehouse":"WH-CENTRAL","quantity_on_hand":310,"reorder_point":40,"last_updated":"2024-11-10"}
{"index":{"_id":11}}
{"product_id":11,"product_name":"Running Shorts","warehouse":"WH-WEST","quantity_on_hand":185,"reorder_point":20,"last_updated":"2024-11-10"}
{"index":{"_id":12}}
{"product_id":12,"product_name":"Trail Gaiters","warehouse":"WH-CENTRAL","quantity_on_hand":92,"reorder_point":15,"last_updated":"2024-11-10"}
{"index":{"_id":13}}
{"product_id":13,"product_name":"Camp Stove","warehouse":"WH-WEST","quantity_on_hand":41,"reorder_point":8,"last_updated":"2024-11-10"}
{"index":{"_id":14}}
{"product_id":14,"product_name":"Sleeping Bag 20F","warehouse":"WH-CENTRAL","quantity_on_hand":0,"reorder_point":5,"last_updated":"2024-11-10"}
{"index":{"_id":15}}
{"product_id":15,"product_name":"Hydration Pack","warehouse":"WH-WEST","quantity_on_hand":129,"reorder_point":15,"last_updated":"2024-11-10"}
{"index":{"_id":16}}
{"product_id":16,"product_name":"Trail Running Vest","warehouse":"WH-CENTRAL","quantity_on_hand":77,"reorder_point":10,"last_updated":"2024-11-10"}
{"index":{"_id":17}}
{"product_id":17,"product_name":"Merino Base Layer","warehouse":"WH-WEST","quantity_on_hand":103,"reorder_point":15,"last_updated":"2024-11-10"}
{"index":{"_id":18}}
{"product_id":18,"product_name":"Trail Map GPS Watch","warehouse":"WH-CENTRAL","quantity_on_hand":29,"reorder_point":5,"last_updated":"2024-11-10"}
{"index":{"_id":19}}
{"product_id":19,"product_name":"Sport Sunglasses","warehouse":"WH-WEST","quantity_on_hand":156,"reorder_point":20,"last_updated":"2024-11-10"}
{"index":{"_id":20}}
{"product_id":20,"product_name":"Quick-Dry Towel","warehouse":"WH-CENTRAL","quantity_on_hand":244,"reorder_point":30,"last_updated":"2024-11-10"}
```

Verify: `GET /store_inventory/_count` → expect 20.

---

## PART 2 — Create roles

Each role uses OpenSearch's Security plugin. The key fields are:

- `index_permissions[].index_patterns` — which indices this role can touch (wildcards supported)
- `index_permissions[].allowed_actions` — what it can do (`read`, `write`, `crud`, `indices:data/read/*`)
- `index_permissions[].dls` — document-level security (filter which docs are visible)
- `index_permissions[].fls` — field-level security (hide or expose specific fields)

---

### Role 1 — catalog_reader_role

Reads `store_products` only. Two restrictions:
- **DLS**: only sees documents where `in_stock = true` (out-of-stock products are hidden)
- **FLS**: `price` field is excluded (pricing is managed by the revenue team)

```
PUT /_plugins/_security/api/roles/catalog_reader_role
{
  "description": "Read-only access to in-stock products. Price field hidden.",
  "cluster_permissions": [],
  "index_permissions": [
    {
      "index_patterns": ["store_products*"],
      "allowed_actions": ["read"],
      "dls": "{\"term\": {\"in_stock\": true}}",
      "fls": ["~price"]
    }
  ],
  "tenant_permissions": []
}
```

> `~price` means **exclude** the price field. All other fields are returned normally.

---

### Role 2 — order_analyst_role

Reads `store_products` and `store_orders`. No field or document restrictions.

```
PUT /_plugins/_security/api/roles/order_analyst_role
{
  "description": "Read-only access to orders and the product catalog.",
  "cluster_permissions": [],
  "index_permissions": [
    {
      "index_patterns": ["store_products*"],
      "allowed_actions": ["read"],
      "dls": "",
      "fls": []
    },
    {
      "index_patterns": ["store_orders*"],
      "allowed_actions": ["read"],
      "dls": "",
      "fls": []
    }
  ],
  "tenant_permissions": []
}
```

---

### Role 3 — inventory_manager_role

Reads `store_products`. Reads **and writes** `store_inventory` (can update stock levels).
Cannot touch `store_orders`.

```
PUT /_plugins/_security/api/roles/inventory_manager_role
{
  "description": "Read access to products. Full read/write on inventory.",
  "cluster_permissions": [],
  "index_permissions": [
    {
      "index_patterns": ["store_products*"],
      "allowed_actions": ["read"],
      "dls": "",
      "fls": []
    },
    {
      "index_patterns": ["store_inventory*"],
      "allowed_actions": ["crud"],
      "dls": "",
      "fls": []
    }
  ],
  "tenant_permissions": []
}
```

> `crud` = create + read + update + delete on documents. It does NOT include index-admin actions like `DELETE /store_inventory` (deleting the whole index).

Verify all three roles were created:

```
GET /_plugins/_security/api/roles/catalog_reader_role
GET /_plugins/_security/api/roles/order_analyst_role
GET /_plugins/_security/api/roles/inventory_manager_role
```

---

## PART 3 — Create users

```
PUT /_plugins/_security/api/internalusers/catalog_user
{
  "password": "Catalog-Pass-1!",
  "backend_roles": [],
  "attributes": { "department": "catalog" }
}

PUT /_plugins/_security/api/internalusers/order_user
{
  "password": "Order-Pass-1!",
  "backend_roles": [],
  "attributes": { "department": "orders" }
}

PUT /_plugins/_security/api/internalusers/inventory_user
{
  "password": "Inventory-Pass-1!",
  "backend_roles": [],
  "attributes": { "department": "inventory" }
}
```

---

## PART 4 — Map users to roles

```
PUT /_plugins/_security/api/rolesmapping/catalog_reader_role
{
  "users": ["catalog_user"]
}

PUT /_plugins/_security/api/rolesmapping/order_analyst_role
{
  "users": ["order_user"]
}

PUT /_plugins/_security/api/rolesmapping/inventory_manager_role
{
  "users": ["inventory_user"]
}
```

Verify the mappings:

```
GET /_plugins/_security/api/rolesmapping/catalog_reader_role
GET /_plugins/_security/api/rolesmapping/order_analyst_role
GET /_plugins/_security/api/rolesmapping/inventory_manager_role
```

---

## PART 5 — Test each scenario

Open a new **incognito browser window** for each user so you can test without
logging out of your admin session.

---

### Scenario A — catalog_user

Log in as `catalog_user` / `Catalog-Pass-1!` and open Dev Tools.

**A1. Read products — should work, but only in-stock items**

```
GET /store_products/_search
{
  "size": 20,
  "query": { "match_all": {} }
}
```

Count the hits — you should see **18 documents**, not 20. Products 6 (Fleece
Pullover) and 14 (Sleeping Bag) are out of stock and are hidden by DLS.

**A2. Confirm the price field is missing**

Look at any document in the response. You will see `name`, `description`,
`category`, `brand`, `rating`, `in_stock` — but **no `price` field**. FLS
removed it before the document reached your session.

**A3. Try to read orders — should fail**

```
GET /store_orders/_search
{
  "query": { "match_all": {} }
}
```

Expected: `403 security_exception`. `catalog_reader_role` has no permission on
`store_orders`.

**A4. Try to read inventory — should fail**

```
GET /store_inventory/_search
{
  "query": { "match_all": {} }
}
```

Expected: `403 security_exception`.

**A5. Try to write to products — should fail**

```
POST /store_products/_doc
{
  "name": "Unauthorized Product",
  "category": "test",
  "price": 9.99,
  "in_stock": true
}
```

Expected: `403 security_exception`. The role only has `read`, not `write`.

---

### Scenario B — order_user

Log in as `order_user` / `Order-Pass-1!` and open Dev Tools.

**B1. Read orders — should work**

```
GET /store_orders/_search
{
  "query": { "match_all": {} }
}
```

You should see all 10 orders.

**B2. Aggregate orders by status**

```
GET /store_orders/_search
{
  "size": 0,
  "aggs": {
    "by_status": {
      "terms": { "field": "status" }
    }
  }
}
```

You can see how many orders are in each status.

**B3. Read products — should work, and price IS visible**

```
GET /store_products/_search
{
  "size": 3,
  "query": { "match_all": {} }
}
```

All 20 products visible, including out-of-stock ones, and the `price` field is
present. `order_analyst_role` has no DLS or FLS restrictions.

**B4. Try to read inventory — should fail**

```
GET /store_inventory/_search
{
  "query": { "match_all": {} }
}
```

Expected: `403 security_exception`.

**B5. Try to update an order — should fail**

```
POST /store_orders/_update/ORD-001
{
  "doc": { "status": "cancelled" }
}
```

Expected: `403 security_exception`. Role is read-only.

---

### Scenario C — inventory_user

Log in as `inventory_user` / `Inventory-Pass-1!` and open Dev Tools.

**C1. Read inventory — should work**

```
GET /store_inventory/_search
{
  "query": { "match_all": {} }
}
```

All 20 stock records visible.

**C2. Find items below reorder point**

```
GET /store_inventory/_search
{
  "query": {
    "script": {
      "script": "doc['quantity_on_hand'].value < doc['reorder_point'].value"
    }
  }
}
```

These products need to be restocked.

**C3. Update a stock level — should work**

The inventory team received a shipment. Update product 6 (Fleece Pullover)
from 0 to 50 units:

```
POST /store_inventory/_update/6
{
  "doc": {
    "quantity_on_hand": 50,
    "last_updated": "2024-11-11"
  }
}
```

Expected: `200 updated`. Read it back to confirm:

```
GET /store_inventory/_doc/6
```

**C4. Add a new inventory record for a new warehouse location**

```
POST /store_inventory/_doc/21
{
  "product_id": 1,
  "product_name": "Trail Running Shoes",
  "warehouse": "WH-EAST",
  "quantity_on_hand": 75,
  "reorder_point": 20,
  "last_updated": "2024-11-11"
}
```

Expected: `201 created`.

**C5. Try to delete the inventory index — should fail**

```
DELETE /store_inventory
```

Expected: `403 security_exception`. `crud` allows document-level writes but
NOT index admin actions like dropping the index.

**C6. Try to read orders — should fail**

```
GET /store_orders/_search
{
  "query": { "match_all": {} }
}
```

Expected: `403 security_exception`.

---

## PART 6 — Cross-scenario comparison

Back in your **admin session**, run the same query as three different users would
and compare the results.

**Admin sees everything:**

```
GET /store_products/_search
{
  "size": 20,
  "_source": ["name", "price", "in_stock"],
  "query": { "match_all": {} }
}
```

20 documents, price visible, both in-stock and out-of-stock.

**What catalog_user sees (simulate with DLS filter):**

```
GET /store_products/_search
{
  "size": 20,
  "_source": ["name", "in_stock"],
  "query": {
    "term": { "in_stock": true }
  }
}
```

18 documents, no price — this is the catalog_user's world.

**Document that shows the difference:**

```
GET /store_products/_doc/6
```

Admin sees `"in_stock": false` and `"price": 54.99`.
`catalog_user` gets a `404` for this document — DLS hides it entirely.

---

## PART 7 — Inspect a role's effective permissions

OpenSearch lets you check what a user is allowed to do without logging in as them.

```
GET /_plugins/_security/api/roles/catalog_reader_role
```

Read the response carefully:

- `index_patterns` — which indices the role matches
- `allowed_actions` — what operations are permitted
- `dls` — the filter query that limits visible documents
- `fls` — fields excluded from responses (prefixed with `~`)

Compare with `order_analyst_role`:

```
GET /_plugins/_security/api/roles/order_analyst_role
```

Notice: no `dls`, no `fls` — the role sees everything it has index access to.

---

## Troubleshooting

| What you see | What to do |
|---|---|
| `403` on a call that should work | Confirm the role mapping includes your user — re-run the `PUT /_plugins/_security/api/rolesmapping/...` call |
| DLS not filtering — out-of-stock products still visible | Re-check the `dls` JSON string is valid — it must be a JSON string inside the role, not a nested object |
| `price` field still showing for catalog_user | Confirm `fls` is `["~price"]` (tilde = exclude). Without tilde it means include-only |
| `inventory_user` cannot update documents | Confirm `allowed_actions` includes `crud`, not just `read` |
| User login fails | Re-run the `PUT /_plugins/_security/api/internalusers/...` command and verify the response shows `status: CREATED` |

---

## What you learned

- **Index-level RBAC**: a role's `index_patterns` determines which indices it can touch. Patterns support wildcards (`store_products*`).
- **Document-level security (DLS)**: limits which documents a role sees using a standard OpenSearch query. Out-of-stock products simply don't exist from `catalog_user`'s perspective.
- **Field-level security (FLS)**: `~fieldname` removes a field from every response. The user cannot retrieve the excluded field by any query.
- **`read` vs `crud`**: `read` allows search and GET. `crud` adds document create/update/delete. Neither allows index admin actions (creating or dropping indices).
- **Role mappings are the bridge**: creating a role and creating a user is not enough. The mapping explicitly connects user → role. Without it, the user gets no permissions beyond the default.
- **Defense in depth**: DLS + FLS + index-pattern restriction + action restriction are four independent layers. Any one of them alone is weaker than all four combined.
