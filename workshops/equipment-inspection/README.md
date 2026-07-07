# Equipment Inspection — S3 + DynamoDB Photo Versioning

> A minimal full-stack app demonstrating how to store versioned inspection photos in S3 and query metadata from DynamoDB. Built for oil & gas / IoT equipment maintenance use cases.

**Stack:** FastAPI · React · DynamoDB · S3 · Terraform

---

## What This Demonstrates

| Concept | Where |
|---|---|
| Timestamp-keyed S3 objects (each upload = new unique key) | `backend/main.py` → `/api/upload-url` |
| DynamoDB single-table design with PK + range key | `terraform/main.tf` + `backend/main.py` |
| Presigned URL upload flow (browser → S3 direct, no proxy) | `frontend/src/App.jsx` → `handleUpload` |
| Version history via `begins_with` sort key query | `backend/main.py` → `get_component_versions` |
| S3 versioning as compliance layer (separate from app versioning) | `terraform/main.tf` → `aws_s3_bucket_versioning` |

---

## Data Model

```
Table: equipment-inspection-<student>
PK  = equipment_id    e.g.  "PUMP-001"
SK  = component_ts    e.g.  "inlet-valve#2026-07-06T10-30-00Z"
```

Every upload creates a **new DynamoDB item** with a unique sort key (component slug + ISO timestamp). There are no in-place updates — the full history is preserved as individual items.

To get all versions of one component:
```python
Key("equipment_id").eq("PUMP-001") & Key("component_ts").begins_with("inlet-valve#")
```

Newest first: `ScanIndexForward=False`  
Latest only: add `Limit=1`

S3 key mirrors the DynamoDB sort key:
```
photos/PUMP-001/inlet-valve/2026-07-06T10-30-00Z.jpg
```

---

## Upload Flow (3 steps)

```
Browser                     FastAPI                  S3              DynamoDB
   │                            │                     │                 │
   │  POST /api/upload-url      │                     │                 │
   │ ─────────────────────────► │                     │                 │
   │  ◄── { upload_url, s3_key, captured_at }         │                 │
   │                            │                     │                 │
   │  PUT <upload_url> (file)   │                     │                 │
   │ ─────────────────────────────────────────────── ►│                 │
   │  ◄── 200 OK ───────────────────────────────────── │                 │
   │                            │                     │                 │
   │  POST /api/photos          │                     │                 │
   │ ─────────────────────────► │                     │                 │
   │                            │  PutItem(metadata)  │ ───────────────►│
   │  ◄── 201 { item } ─────────│                     │                 │
```

The browser uploads directly to S3 (step 2 bypasses the backend entirely).
The backend only handles metadata and URL generation — it never touches the binary.

---

## Quick Start

### 1. Provision AWS resources

```bash
cd terraform
terraform init
terraform apply -var="student_name=alice-johnson"
```

Copy the outputs into `.env`:
```bash
cp .env.example .env
# fill in S3_BUCKET and DYNAMODB_TABLE from terraform output
```

### 2. Start backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
source ../.env && uvicorn main:app --reload
```

Backend runs at http://localhost:8000. Swagger docs at http://localhost:8000/docs

### 3. Start frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at http://localhost:5173. Vite proxies `/api/*` to the backend — no CORS issues in local dev.

---

## API Reference

| Method | Path | What it does |
|---|---|---|
| `POST` | `/api/upload-url` | Returns presigned S3 PUT URL + generated S3 key |
| `POST` | `/api/photos` | Saves photo metadata to DynamoDB after upload |
| `GET`  | `/api/equipment/{id}/photos` | All photos for an equipment asset, newest first |
| `GET`  | `/api/equipment/{id}/photos/{component}` | Version history for one component |
| `GET`  | `/api/equipment/{id}/photos/{component}/latest` | Latest photo only |

Full interactive docs: http://localhost:8000/docs

---

## Sample Equipment IDs

| ID | Type | Sample components |
|---|---|---|
| `PUMP-001` | Centrifugal pump | Inlet Valve, Outlet Valve, Impeller, Motor Housing |
| `VALVE-042` | Gate valve | Actuator, Stem, Body, Seat |
| `COMP-07`  | Gas compressor | Cylinder Head, Suction Valve, Discharge Valve |
| `SEP-003`  | Oil separator | Mist Eliminator, Level Gauge, Pressure Relief Valve |

---

## Teardown

```bash
# Remove all photos from S3 first (versioned bucket must be emptied manually)
aws s3 rm s3://<your-bucket> --recursive

# Then destroy infrastructure
cd terraform && terraform destroy -var="student_name=alice-johnson"
```

---

## Extension Ideas

- Add a `FLAGGED → REVIEWED → APPROVED` status workflow with a PATCH endpoint
- Add a GSI on `technician_id` to query "all photos by this technician this week"
- Swap React for a mobile-friendly PWA so field technicians can upload from a phone camera
- Add S3 Object Lock (WORM) to enforce regulatory retention periods
- Trigger a Lambda on S3 PUT to run Amazon Rekognition and auto-tag severity

---

## License

MIT — fork it, adapt it, build on it.
