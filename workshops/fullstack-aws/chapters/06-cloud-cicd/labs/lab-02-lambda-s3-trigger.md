# Lab — Lambda S3 Trigger

## What You'll Build

A Lambda function that automatically runs whenever a file is uploaded to an S3 bucket.
It logs the bucket name and file name to CloudWatch — the foundation of event-driven serverless architecture.

```
Upload file → S3 Bucket → triggers → Lambda Function → logs to → CloudWatch
```

---

## Prerequisites

- AWS Console access with student IAM policies attached
- Region set to **us-east-1** (top-right of AWS Console)

---

## Part 1 — Create the S3 Bucket

1. Go to **S3** → **Create bucket**
2. Set bucket name: `student-<your-name>-uploads` (e.g. `student-alice-uploads`)
3. Region: **us-east-1**
4. Leave all other settings as default
5. Click **Create bucket**

---

## Part 2 — Create the Lambda Function

1. Go to **Lambda** → **Create function**
2. Select **Author from scratch**
3. Fill in:
   - Function name: `student-s3-logger`
   - Runtime: **Python 3.12**
   - Region: **us-east-1**
4. Click **Create function**

### Add the code

In the **Code** tab, replace the default code with:

```python
import json

def lambda_handler(event, context):
    for record in event['Records']:
        bucket = record['s3']['bucket']['name']
        key = record['s3']['object']['key']
        print(f"File uploaded: {key} in bucket: {bucket}")

    return {
        'statusCode': 200,
        'body': json.dumps('Done')
    }
```

Click **Deploy**.

---

## Part 3 — Add the S3 Trigger

1. In your Lambda function, click **Add trigger**
2. Select **S3**
3. Fill in:
   - Bucket: select `student-<your-name>-uploads`
   - Event types: **PUT**
4. Check the acknowledgement checkbox
5. Click **Add**

You should now see the S3 trigger appear in the function overview diagram.

---

## Part 4 — Test It

### Upload a file

1. Go to **S3** → open your `student-<your-name>-uploads` bucket
2. Click **Upload** → **Add files**
3. Pick any file from your computer (e.g. a `.txt` or `.png`)
4. Click **Upload**

### Check the logs

1. Go back to your Lambda function
2. Click the **Monitor** tab
3. Click **View CloudWatch logs**
4. Click the most recent **log stream**
5. Look for a line like:
   ```
   File uploaded: myfile.txt in bucket: student-alice-uploads
   ```

---

## Part 5 — Test with a JSON Event (Optional)

You can simulate an S3 trigger without uploading a file:

1. In the Lambda **Code** tab, click the **Test** button (top right)
2. Click **Create new event**
3. Event name: `test-s3-upload`
4. Select template: **s3-put**
5. Change the `"key"` value inside the template to `"hello-world.txt"`
6. Click **Save** then **Test**
7. Check the **Execution results** panel for the printed output

---

## What You Learned

| Concept | What happened |
|---------|--------------|
| S3 Event Notification | S3 automatically calls Lambda when a file is uploaded |
| Lambda Trigger | Lambda is invoked with the event payload describing the upload |
| CloudWatch Logs | Every `print()` in your Lambda is captured as a log entry |
| Event-driven architecture | No server polling — the upload *event* drives the execution |

---

## Cleanup

Delete resources to avoid charges:

```
1. Lambda → student-s3-logger → Actions → Delete function
2. S3 → student-<your-name>-uploads → Empty bucket → Delete bucket
```
