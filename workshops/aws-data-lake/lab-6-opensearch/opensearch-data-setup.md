# OpenSearch Lab — Instructor Setup Guide

Do this BEFORE the bootcamp. The domain takes 15-30 min to create, so build it
the day before. This guide gets you: one shared domain, sample e-commerce data
loaded, and student users mapped to full admin (all_access).

Region assumed: us-west-2. Adjust as needed.

## STEP 1 — Create the domain 

```
aws opensearch create-domain \
--domain-name bootcamp-search \
--engine-version "OpenSearch_2.13" \
--cluster-config InstanceType=r6g.large.search,InstanceCount=1 \
--ebs-options EBSEnabled=true,VolumeType=gp3,VolumeSize=30 \
--encryption-at-rest-options Enabled=true \
--node-to-node-encryption-options Enabled=true \
--domain-endpoint-options EnforceHTTPS=true,TLSSecurityPolicy=Policy-Min-TLS-1-2-2019-07 \
--advanced-security-options \
  'Enabled=true,InternalUserDatabaseEnabled=true,MasterUserOptions={MasterUserName=admin,MasterUserPassword=<strong-pass>}' \
--access-policies '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"AWS":"*"},"Action":"es:*","Resource":"arn:aws:es:us-west-2:<ACCOUNT_ID>:domain/bootcamp-search/*"}]}' \
--region us-west-2
```


## STEP 2 — Log in to Dashboards as admin

1. Open the Dashboards URL in a browser.
2. Log in with admin / <master password>.
3. If prompted about tenants, choose Global tenant.
4. You'll use Dev Tools (left menu -> Dev Tools) to load data and create roles.

## STEP 3 — Load sample e-commerce data

In Dev Tools, paste and run this. It creates a "products" index and bulk-loads
20 products. (Run the whole block; the _bulk body must end with a newline.)

    PUT /products
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

Then bulk load:

    POST /products/_bulk
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

Verify:

    GET /products/_count
    // expect: count = 20



## STEP 4 — Create student users and map them to all_access (full admin)

Create one internal user per student. In Dev Tools (logged in as master admin),
repeat for each NN:

    PUT /_plugins/_security/api/internalusers/studentNN
    {
      "password": "Student-Pass-NN!",
      "backend_roles": [],
      "attributes": {}
    }

Verify each one stuck:

    GET /_plugins/_security/api/internalusers/studentNN
    // should return the user, not NOT_FOUND

Then map ALL students to all_access in one shot. IMPORTANT: this call REPLACES
the existing mapping, so list every student each time, and preserve the admin
master user's access (admin already has it via master user, so you don't need
to add admin here — but do NOT remove admin's own separate access).

    PUT /_plugins/_security/api/rolesmapping/all_access
    {
      "users": ["student01","student02","student03","student04","student05"]
    }

(Add as many studentNN as you have. Each student is now a FULL admin on the
domain.)

Verify the mapping:

    GET /_plugins/_security/api/rolesmapping/all_access

## STEP 6 — Smoke test as a student BEFORE the bootcamp

1. Open an incognito browser window -> Dashboards URL (.../_dashboards/).
2. Log in as student01 / its password.
3. Go to Dev Tools. Run:  GET /products/_search
   - Should return products. GOOD.
4. Since students are admin now, a write SUCCEEDS (this is expected with admin):
       POST /products/_doc
       {"name":"test"}
   - A 201/created here is normal for admin. (Delete that test doc after:
       POST /products/_delete_by_query
       {"query":{"match":{"name":"test"}}}  )
5. Confirm they can reach Dashboards features: open Discover, Visualize, Dashboard
   from the left menu — all should be accessible.

If student01 can search AND can open the Dashboards build tools, you're ready.

## WHAT TO HAND EACH STUDENT

- Dashboards URL
- Their username studentNN + password
- The student lab handout (separate file)

## TEARDOWN (after the bootcamp — stops billing)

    aws opensearch delete-domain --domain-name bootcamp-search --region us-west-2

