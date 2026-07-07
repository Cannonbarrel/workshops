# Lab 7 — CloudWatch: Alarm on Lambda Errors


## Part A — Create the Lambda function

This is a simplified version of the Lab 2 ingestion function. It validates
that an S3 event carries a `.csv` file — the same check your full pipeline
depends on.

**Step 1 — Open Lambda and create the function**

1. Open the AWS Console → **Lambda → Functions → Create function**
2. Choose **Author from scratch**
3. Function name: `quicklabs-studentNN-oil-ingest` (replace `studentNN` with your username, e.g. `quicklabs-student9-oil-ingest`)
4. Runtime: **Python 3.12**
5. Architecture: **x86_64**
6. Under **Permissions → Execution role**, choose **Use an existing role**
   and select `quicklabs-studentNN-lambda-role` (replace `studentNN` with your
   username, e.g. `quicklabs-bob-patel-lambda-role`)
7. Click **Create function**

**Step 2 — Paste the handler code**

In the **Code** tab, click on `lambda_function.py` and replace all the
contents with:

```python
import urllib.parse

def lambda_handler(event, context):
    records = event["Records"]          # KeyError if event has no Records
    for record in records:
        bucket = record["s3"]["bucket"]["name"]
        key    = urllib.parse.unquote_plus(record["s3"]["object"]["key"])
        if not key.endswith(".csv"):
            raise ValueError(f"expected .csv file, got: {key}")
        print(f"would process oil data: s3://{bucket}/{key}")
    return {"processed": len(records)}
```

Click **Deploy**.

**Step 3 — Run a first test invocation (required before creating the alarm)**

CloudWatch only shows the `AWS/Lambda` namespace in Browse after the function
has published at least one metric. Invoke it once now so the namespace appears.

1. Click the **Test** tab
2. Click **Create new event**, name it `first-run`
3. Replace the JSON body with a valid S3 payload pointing to the real oil data:
   ```json
   {
     "Records": [
       {
         "s3": {
           "bucket": { "name": "quicklabs-raw-data" },
           "object": { "key": "oil/Crude_Oil_historical_data.csv" }
         }
       }
     ]
   }
   ```
4. Click **Test** — you should see a green **Execution result: succeeded** banner

Wait about 1 minute, then continue to Part B. This invocation registers the
function in CloudWatch and makes its metrics browsable.

---

## Part B — Create an SNS topic (receives the alarm email)

1. Open the AWS Console → **SNS → Topics → Create topic**
2. Type: **Standard**
3. Name: `lambda-alerts-studentNN` (replace `studentNN` with your username)
4. Click **Create topic**

**Subscribe your email:**
1. On the topic page click **Create subscription**
2. Protocol: `Email`
3. Endpoint: your email address
4. Click **Create subscription**
5. Open your inbox and click **Confirm subscription**

The subscription shows **Pending confirmation** until you click that link.
The alarm will not email you until it is confirmed.

---

## Part C — Create the alarm

1. Open **CloudWatch → Alarms → Create alarm**
2. When asked for alarm type, choose **Classic** (not PromQL — that is for
   Prometheus metrics, not AWS service metrics)
3. Click **Select metric**
4. In the search box type `quicklabs-studentNN-oil-ingest` (your function name from Part A)
5. Choose **Lambda → By Function Name**
6. Tick the row for **Errors** on your function → click **Select metric**

Configure the metric:
- Statistic: **Sum**
- Period: **1 minute**

Configure the condition:
- Threshold type: **Static**
- Condition: **Greater than** `0`
- Datapoints to alarm: **1 out of 1**

> One error is enough — this function should never fail in normal operation.

Configure actions:
- Alarm state trigger: **In alarm**
- Send notification to: select the SNS topic you created in Part B

Name the alarm: `lambda-ingestion-errors-studentNN`

Click **Create alarm**.

---

## Part D — Trigger an error and watch the alarm fire

Now deliberately break the Lambda invocation so CloudWatch records an error.

1. Open **Lambda** → find your function (`quicklabs-studentNN-oil-ingest`)
2. Click the **Test** tab
3. Click **Create new event**
4. Event name: `bad-input`
5. Replace the JSON body with this invalid payload:
   ```json
   { "not_a_real_key": true }
   ```
6. Click **Test**

The function will fail. You should see a red **Execution result: failed**
banner in the console output.

**Now watch CloudWatch:**
1. Go back to **CloudWatch → Alarms**
2. Find `lambda-ingestion-errors-studentNN`
3. Refresh every 30 seconds — within 1–2 minutes it transitions:
   `OK → In alarm`
4. Check your email — you should receive the SNS notification

**If the alarm does not move after 3 minutes:**
- Re-run the Test step once more (metrics need at least one datapoint in the
  evaluation window)
- Confirm your SNS subscription is in **Confirmed** state (not Pending)

---

## Part E — Restore and verify recovery

1. Edit the test event back to the valid S3 payload:
   ```json
   {
     "Records": [
       {
         "s3": {
           "bucket": { "name": "quicklabs-raw-data" },
           "object": { "key": "oil/Crude_Oil_historical_data.csv" }
         }
       }
     ]
   }
   ```
2. Click **Test** — you should see a green **Execution result: succeeded**
   banner. The function prints `would process oil data: s3://quicklabs-raw-data/oil/Crude_Oil_historical_data.csv`
   and returns `{"processed": 1}`.
3. Go back to **CloudWatch → Alarms** and watch the alarm transition back to
   **OK** (may take 1–2 minutes)

> **Why this matters:** An `OK → In alarm → OK` cycle confirms your entire
> alerting chain works end-to-end — CloudWatch captured the metric, evaluated
> the threshold, SNS delivered the email, and the alarm self-cleared once
> errors stopped.

---

## Cleanup

1. Delete the Lambda function: **Lambda → Functions → select → Actions → Delete**
2. Delete the alarm: **CloudWatch → Alarms → select → Actions → Delete**
3. Delete the SNS topic: **SNS → Topics → select → Delete**
