import json
import os
from datetime import datetime, timezone
from bson import ObjectId
from pymongo import MongoClient

MONGO_HOST = os.environ["MONGO_HOST"]
MONGO_PORT = int(os.environ.get("MONGO_PORT", 27017))


def get_collection():
    client = MongoClient(host=MONGO_HOST, port=MONGO_PORT, serverSelectionTimeoutMS=5000)
    return client["tasktracker"]["tasks"]


def lambda_handler(event, context):
    method = event.get("requestContext", {}).get("http", {}).get("method", "GET")
    path   = event.get("rawPath", "/")

    print(f"Request: {method} {path}")

    # Handle CORS preflight
    if method == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            },
            "body": "",
        }

    try:
        if method == "GET" and path == "/tasks":
            return get_tasks()

        if method == "POST" and path == "/tasks":
            body = json.loads(event.get("body") or "{}")
            return create_task(body)

        if method == "PUT" and path.startswith("/tasks/"):
            task_id = path.split("/")[-1]
            body = json.loads(event.get("body") or "{}")
            return update_task(task_id, body)

        if method == "DELETE" and path.startswith("/tasks/"):
            task_id = path.split("/")[-1]
            return delete_task(task_id)

        return response(404, {"error": f"Route not found: {method} {path}"})

    except Exception as e:
        print(f"Error: {e}")
        return response(500, {"error": str(e)})


def get_tasks():
    tasks = list(get_collection().find({}, {"_id": 1, "title": 1, "description": 1, "priority": 1, "status": 1, "created_at": 1}))
    for t in tasks:
        t["id"] = str(t.pop("_id"))
    return response(200, {"tasks": tasks})


def create_task(body):
    title = body.get("title", "").strip()
    if not title:
        return response(400, {"error": "title is required"})

    task = {
        "title":       title,
        "description": body.get("description", ""),
        "priority":    body.get("priority", "medium"),
        "status":      "todo",
        "created_at":  datetime.now(timezone.utc).isoformat(),
    }
    result = get_collection().insert_one(task)
    task["id"] = str(result.inserted_id)
    task.pop("_id", None)
    return response(201, {"task": task})


def update_task(task_id, body):
    allowed = {"title", "description", "priority", "status"}
    updates = {k: v for k, v in body.items() if k in allowed}
    if not updates:
        return response(400, {"error": "No valid fields to update"})

    result = get_collection().update_one({"_id": ObjectId(task_id)}, {"$set": updates})
    if result.matched_count == 0:
        return response(404, {"error": "Task not found"})
    return response(200, {"updated": task_id})


def delete_task(task_id):
    result = get_collection().delete_one({"_id": ObjectId(task_id)})
    if result.deleted_count == 0:
        return response(404, {"error": "Task not found"})
    return response(200, {"deleted": task_id})


def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps(body),
    }
