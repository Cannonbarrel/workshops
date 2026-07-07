##  Access Private OpenSearch via Jumpbox

This guide explains how to connect to a secure VPC OpenSearch domain using an assumed IAM Admin role and an EC2 jumpbox.

## 1. Network Tunnel (From Local Laptop Terminal)
Run this command on your local machine to pipe port 9200 through your jumpbox directly to OpenSearch.

```
ssh -N -L 9200:://amazonaws.com -i cloudwatch-demo.pem ec2-user@://amazonaws.com
```

* Note: The terminal will appear frozen or hung. Keep this window open to maintain the connection.


## 2. API Access (From Jumpbox Terminal)
To interact with the database programmatically using your assumed IAM Admin role, execute signed scripts inside the jumpbox.
## Environment Setup

pip install requests requests-aws4auth boto3

## Verification Script (check_health.py)

```
import boto3, requestsfrom requests_aws4auth import AWS4Auth
print(requests.get(f"{host}/_cluster/health", auth=awsauth).json())
```
## 3. Web UI Access (From Laptop Browser)

   1. Keep the SSH tunnel from Step 1 running.
   2. Open your local browser and navigate to:
   
   https://localhost:9200/_dashboards
   
   3. Bypass SSL Warning: Click Advanced -> Proceed to localhost (unsafe).
   4. Login Credentials:
   * Use the Internal Master User username/password configured during cluster creation.
      * If you only configured IAM authentication, you must map your IAM role ARN to the all_access role inside OpenSearch Dashboards first, or use Amazon Cognito.
   


