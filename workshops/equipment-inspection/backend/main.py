from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, timezone
import boto3
import os
from boto3.dynamodb.conditions import Key

app = FastAPI(title="Equipment Inspection API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

S3_BUCKET  = os.getenv("S3_BUCKET", "equipment-inspections-demo")
TABLE_NAME = os.getenv("DYNAMODB_TABLE", "equipment-inspections")
REGION     = os.getenv("AWS_REGION", "us-east-1")

s3       = boto3.client("s3", region_name=REGION)
dynamodb = boto3.resource("dynamodb", region_name=REGION)
table    = dynamodb.Table(TABLE_NAME)


# ── request / response models ───────────────────────────────────────────────

class UploadUrlRequest(BaseModel):
    equipment_id: str
    component: str
    technician_id: str
    file_ext: str = "jpg"   # frontend passes actual extension


class PhotoRecord(BaseModel):
    equipment_id: str
    component: str
    s3_key: str
    captured_at: str         # ISO string returned by /upload-url
    technician_id: str
    severity: str = "LOW"    # LOW | MEDIUM | HIGH | CRITICAL
    notes: str = ""


# ── endpoints ───────────────────────────────────────────────────────────────

@app.post("/api/upload-url")
def get_upload_url(req: UploadUrlRequest):
    """
    Step 1 of the upload flow.
    Returns a presigned PUT URL and the S3 key the frontend should use.
    The key embeds a timestamp so every upload is a new, distinct object.
    S3 versioning (enabled by Terraform) adds an extra immutability layer on top.
    """
    ts            = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H-%M-%SZ")
    component_slug = req.component.lower().replace(" ", "-")
    ext           = req.file_ext.lstrip(".")
    s3_key        = f"photos/{req.equipment_id}/{component_slug}/{ts}.{ext}"
    captured_at   = datetime.now(timezone.utc).isoformat()

    upload_url = s3.generate_presigned_url(
        "put_object",
        Params={"Bucket": S3_BUCKET, "Key": s3_key},
        ExpiresIn=300,
    )
    return {"upload_url": upload_url, "s3_key": s3_key, "captured_at": captured_at}


@app.post("/api/photos", status_code=201)
def save_photo(record: PhotoRecord):
    """
    Step 3 of the upload flow (step 2 is the browser PUT to S3).
    Writes metadata to DynamoDB.

    DynamoDB schema:
      PK  = equipment_id   (e.g. "PUMP-001")
      SK  = component_ts   (e.g. "inlet-valve#2026-07-06T10-30-00Z")
    Querying SK begins_with "<component>#" retrieves full version history,
    sorted ascending/descending by timestamp at query time.
    """
    component_slug = record.component.lower().replace(" ", "-")
    sk = f"{component_slug}#{record.captured_at}"

    item = {
        "equipment_id": record.equipment_id,
        "component_ts": sk,
        "component":    record.component,
        "s3_key":       record.s3_key,
        "technician_id": record.technician_id,
        "severity":     record.severity,
        "notes":        record.notes,
        "captured_at":  record.captured_at,
        "status":       "PENDING",
    }
    table.put_item(Item=item)
    return item


@app.get("/api/equipment/{equipment_id}/photos")
def list_all_photos(equipment_id: str):
    """All photos for an equipment asset, newest first."""
    resp = table.query(
        KeyConditionExpression=Key("equipment_id").eq(equipment_id),
        ScanIndexForward=False,
    )
    return _add_photo_urls(resp.get("Items", []))


@app.get("/api/equipment/{equipment_id}/photos/{component_slug}")
def get_component_versions(equipment_id: str, component_slug: str):
    """Full version history for one component, newest first."""
    resp = table.query(
        KeyConditionExpression=(
            Key("equipment_id").eq(equipment_id) &
            Key("component_ts").begins_with(f"{component_slug}#")
        ),
        ScanIndexForward=False,
    )
    items = _add_photo_urls(resp.get("Items", []))
    # Attach version numbers (v1 = oldest, vN = newest)
    for i, item in enumerate(reversed(items)):
        item["version_num"] = i + 1
    items.reverse()
    return items


@app.get("/api/equipment/{equipment_id}/photos/{component_slug}/latest")
def get_latest(equipment_id: str, component_slug: str):
    resp = table.query(
        KeyConditionExpression=(
            Key("equipment_id").eq(equipment_id) &
            Key("component_ts").begins_with(f"{component_slug}#")
        ),
        ScanIndexForward=False,
        Limit=1,
    )
    items = resp.get("Items", [])
    if not items:
        raise HTTPException(status_code=404, detail="No photos found for this component")
    return _add_photo_urls(items)[0]


# ── helpers ──────────────────────────────────────────────────────────────────

def _add_photo_urls(items: list) -> list:
    for item in items:
        item["photo_url"] = s3.generate_presigned_url(
            "get_object",
            Params={"Bucket": S3_BUCKET, "Key": item["s3_key"]},
            ExpiresIn=3600,
        )
    return items
