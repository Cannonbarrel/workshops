# Lab — Lambda + API Gateway + MongoDB on EC2

## What You'll Build

A serverless API that reads and writes data to MongoDB running on an EC2 instance.

```
Browser / curl → API Gateway → Lambda → MongoDB on EC2
```

| Method | Path | Description |
|--------|------|-------------|
| GET | `/employees` | Return all employees |
| POST | `/employees` | Add a new employee |

---

## Prerequisites

- Completed [Lab — Deploy to EC2 with CI/CD](./Lab-Deploy-EC2-CICD.md) — Terraform must be installed
- Completed [Lab — Lambda REST API](./Lab-Lambda-REST-API.md)
- Region: **us-east-1**
- Python and pip installed on your local machine (to build the Lambda package)

---

## Part 1 — Launch EC2 with MongoDB

### Launch the instance using Terraform

Reuse the Terraform template from the previous lab (`terraform-ec2/`). Port **27017** is already open in the security group — confirm it is there before applying:

```bash
# From the terraform-ec2/ folder
grep -A5 "MongoDB" main.tf
```

You should see:

```hcl
# MongoDB — direct access for Lambda and testing
ingress {
  from_port   = 27017
  to_port     = 27017
  protocol    = "tcp"
  cidr_blocks = ["0.0.0.0/0"]
}
```

If the block is missing, add it to the `aws_security_group` resource in `main.tf` before continuing.

Then apply:

```bash
terraform init   # only needed first time
terraform apply
```

Note the outputs — you will need the public IP and the SSH command:

```
instance_public_ip = "x.x.x.x"
ssh_command        = "ssh -i ssh-keys/student-employee-app-key.pem ubuntu@x.x.x.x"
```

### Install MongoDB via SSH

Copy the SSH command from the Terraform output and connect:

```bash
ssh -i ssh-keys/student-employee-app-key.pem ubuntu@<EC2_PUBLIC_IP>
```

Then run:

```bash
# Install dependencies
sudo apt-get install -y gnupg curl

# Install MongoDB 8
curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | \
  sudo gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg --dearmor

echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] \
  https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/8.0 multiverse" | \
  sudo tee /etc/apt/sources.list.d/mongodb-org-8.0.list

sudo apt-get update -y
sudo apt-get install -y mongodb-org

sudo systemctl enable mongod
sudo systemctl start mongod
```

### Allow external connections

By default MongoDB only listens on localhost. Open it to all interfaces:

```bash
sudo sed -i 's/bindIp: 127.0.0.1/bindIp: 0.0.0.0/' /etc/mongod.conf
sudo systemctl restart mongod
```

### Verify

```bash
mongosh --eval "db.runCommand({ connectionStatus: 1 })"
```

You should see `"ok": 1`. Note down the **EC2 public IP** — you will need it in Part 3.

### Seed initial data

While still SSH'd into the EC2, open mongosh and insert some employees:

```bash
mongosh
```

```js
use company

db.employees.insertMany([
  { name: "Alice", role: "Engineer" },
  { name: "Bob", role: "Designer" },
  { name: "Carol", role: "Manager" }
])

// Verify
db.employees.find()
```

Type `exit` to leave mongosh.

---

## Part 2 — Build the Lambda Deployment Package

Lambda needs `pymongo` bundled with the function code. Run this on your local machine:

```bash
# Create a working folder
mkdir lambda-mongodb && cd lambda-mongodb

# Install pymongo into the folder
pip install pymongo -t .

# Create the function file
cat > lambda_function.py << 'EOF'
import json
import os
from pymongo import MongoClient

MONGO_HOST = os.environ["MONGO_HOST"]
MONGO_PORT = int(os.environ.get("MONGO_PORT", 27017))

def get_client():
    return MongoClient(host=MONGO_HOST, port=MONGO_PORT, serverSelectionTimeoutMS=5000)

def lambda_handler(event, context):
    method = event.get("requestContext", {}).get("http", {}).get("method", "GET")
    path   = event.get("rawPath", "/")

    print(f"Request: {method} {path}")

    client = get_client()
    db = client["company"]
    collection = db["employees"]

    # GET /employees
    if method == "GET" and path == "/employees":
        employees = list(collection.find({}, {"_id": 0}))
        return response(200, {"employees": employees})

    # POST /employees
    if method == "POST" and path == "/employees":
        body = json.loads(event.get("body") or "{}")
        name = body.get("name")
        role = body.get("role")

        if not name or not role:
            return response(400, {"error": "Missing 'name' or 'role'"})

        employee = {"name": name, "role": role}
        collection.insert_one(employee)
        employee.pop("_id", None)
        return response(201, {"created": employee})

    return response(404, {"error": f"Route not found: {method} {path}"})


def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body),
    }
EOF



# Zip everything
zip -r ../lambda-mongodb.zip .
cd ..
```

You should now have a `lambda-mongodb.zip` file ready to upload.

### Expected zip structure

Lambda requires the handler file and all dependencies at the **root level** of the zip (not inside a subfolder):

```
lambda-mongodb.zip
├── lambda_function.py        ← your handler (root level — required)
├── pymongo/                  ← pymongo package
├── bson/                     ← BSON serialization (bundled with pymongo)
├── gridfs/                   ← GridFS module (bundled with pymongo)
├── dns/                      ← dnspython dependency
└── ...                       ← other pymongo dependencies
```

> **Important:** If `lambda_function.py` is inside a subfolder (e.g. `lambda-mongodb/lambda_function.py`), Lambda will throw `Unable to import module` on every invocation. Always zip from inside the folder, not from outside it.

---

## Part 3 — Create the Lambda Function

1. Go to **Lambda** → **Create function**
2. Select **Author from scratch**
3. Fill in:
   - Function name: `student-mongodb-api`
   - Runtime: **Python 3.12**
   - Region: **us-east-1**
4. Click **Create function**

### Upload the zip

1. In the **Code** tab → **Upload from** → **.zip file**
2. Select `lambda-mongodb.zip`
3. Click **Save**


### Set environment variables

1. Go to the **Configuration** tab → **Environment variables** → **Edit**
2. Add:
   - Key: `MONGO_HOST` — Value: `<your EC2 public IP>`
3. Click **Save**

### Increase the timeout

MongoDB connections can be slow on cold start:

1. **Configuration** tab → **General configuration** → **Edit**
2. Set Timeout to **15 seconds**
3. Click **Save**

---

## Part 4 — Create the API Gateway

1. Go to **API Gateway** → **Create API** → **HTTP API** → **Build**
2. Add integration:
   - Type: **Lambda**
   - Function: `student-mongodb-api`
   - Payload format version: **2.0**
3. API name: `student-mongodb-api-gw`
4. Add routes:

   | Method | Path |
   |--------|------|
   | GET | `/employees` |
   | POST | `/employees` |

5. Click **Next** → **Next** → **Create**
6. Go to **Deploy** → **Stages** → click `$default` → copy the **Invoke URL**

---

## Part 5 — Seed Some Data

Before testing GET, add a couple of employees:

```bash
curl -X POST https://<your-invoke-url>/employees \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice", "role": "Engineer"}'

curl -X POST https://<your-invoke-url>/employees \
  -H "Content-Type: application/json" \
  -d '{"name": "Bob", "role": "Designer"}'
```

---

## Part 6 — Test the API

### GET all employees

```bash
curl https://<your-invoke-url>/employees
```

Expected:
```json
{
  "employees": [
    {"name": "Alice", "role": "Engineer"},
    {"name": "Bob", "role": "Designer"}
  ]
}
```

### POST a new employee

```bash
curl -X POST https://<your-invoke-url>/employees \
  -H "Content-Type: application/json" \
  -d '{"name": "Carol", "role": "Manager"}'
```

### Test validation error

```bash
curl -X POST https://<your-invoke-url>/employees \
  -H "Content-Type: application/json" \
  -d '{"name": "Dave"}'
```

Expected:
```json
{"error": "Missing 'name' or 'role'"}
```

---

## Part 7 — View Logs

1. Go to **Lambda** → `student-mongodb-api` → **Monitor** tab
2. Click **View CloudWatch logs**
3. Open the latest log stream — you'll see each request and any connection errors

---

## What You Learned

| Concept | What happened |
|---------|--------------|
| Lambda + MongoDB | Lambda connects to MongoDB using `pymongo` and the EC2 public IP |
| Deployment package | Dependencies bundled as a zip — Lambda has no package manager |
| Environment variables | Secrets and config kept out of code |
| Cold start timeout | MongoDB TCP handshake needs a longer timeout than the default 3s |
| Serverless + stateful DB | Lambda is stateless; MongoDB on EC2 holds the persistent state |

---

## Cleanup

```
1. API Gateway → student-mongodb-api-gw → Delete
2. Lambda → student-mongodb-api → Delete
3. EC2 → student-mongodb-server → Terminate instance
```
