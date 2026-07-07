# AWS IAM Policy Lab — Student Handout

You'll learn IAM by **reading and modifying the sandbox policy already protecting you** in the AWS Data Lake lab. Every exercise has two paths — pick the one you prefer per exercise. By the end you'll be able to:

- Read any IAM policy and explain what it allows or forbids
- Predict whether an action will be allowed before running it
- Add a new statement to an existing policy without breaking anything
- Write a bucket policy and a fresh IAM policy from scratch
- Verify with the **AWS Policy Simulator** (Console) or `aws iam simulate-custom-policy` (CLI)

**Time:** ~60 min for ex 1–4, +30 min for 5–6.

---

## Setup

You need either path to work — pick one for setup. Most exercises offer both later.

### Setup A — Console only

1. Sign in to the AWS console as `quicklabs-<USER>` (creds your instructor gave you).
2. Region picker (top-right) → **US West (Oregon) us-west-2**.
3. Open three tabs you'll keep returning to:
   - **IAM** (Services → IAM)
   - **AWS Policy Simulator** → <https://policysim.aws.amazon.com/>
   - **S3** (Services → S3) — only needed for ex 5

### Setup B — CLI

```bash
# Use AWS CloudShell (top-right icon in the console — credentials are auto-injected)
# OR your laptop with `aws configure` against your quicklabs-<USER> creds.

# Login to ec2 Machine, change to the <userid>

sudo su - student3

aws sts get-caller-identity              # confirm you're signed in
USER=<your-short-name>                   # e.g. suresh — drop the `quicklabs-` prefix
ACCT=$(aws sts get-caller-identity --query Account --output text)
echo "user: quicklabs-${USER}, account: ${ACCT}"
```

---

## Vocabulary you need

- **Identity-based policy** — attached to a user/role/group. Says what the holder can do.
- **Resource-based policy** — attached to a resource (bucket, role's trust). Says who can do what to it.
- **Effect** — `Allow` or `Deny`. **Deny always wins**, regardless of how many Allows.
- **Action** — what API call (e.g. `s3:GetObject`).
- **Resource** — what ARN the action operates on.
- **Condition** — extra constraint (region, IP, MFA, time of day).
- **`NotAction` / `NotResource`** — *match everything EXCEPT this list*. Combined with `Deny`, this is a "deny-by-default with exceptions" pattern.
- **Implicit deny** — no statement says yes, no statement says no → denied.
- **Explicit deny** — a `Deny` statement matched → denied. Beats any Allow.

---

## Exercise 1 — Inventory your own policy (15 min)

Find your sandbox policy and answer the questions.

### Console

1. **IAM** → **Users** → click `quicklabs-<USER>`.
2. **Permissions** tab → click the policy named `quicklabs-<USER>-data-lake-sandbox`.
3. **{ } JSON** sub-tab. Read all the statements.

### CLI

```bash
POLICY_ARN="arn:aws:iam::${ACCT}:policy/quicklabs-${USER}-data-lake-sandbox"
VERSION=$(aws iam get-policy --policy-arn "$POLICY_ARN" --query 'Policy.DefaultVersionId' --output text)
aws iam get-policy-version --policy-arn "$POLICY_ARN" --version-id "$VERSION" \
  --query 'PolicyVersion.Document' --output json > my-policy.json

# One-line view: list every Sid and its Effect.
jq -r '.Statement[] | "\(.Effect | ascii_upcase)  \(.Sid)"' my-policy.json
```

### Answer (write down — both paths)

1. How many statements total?
2. How many `Allow` vs `Deny`?
3. Which **one** Sid is responsible for the region lock?
4. Which Sid lets you `iam:CreateVirtualMFADevice` for yourself?
5. Look at `S3FullAccessOwnBuckets` — what bucket-name patterns can you write to?

> Don't skip — every later exercise assumes you've actually opened the policy.

---

## Exercise 2 — Predict the deny (15 min)

The `DenyOutsideUSWest2` Sid uses `NotAction` + `Condition`. **Predict** the decision for each call below, then verify.

| # | Action | Resource | Region context | Predict |
|---|---|---|---|---|
| 1 | `s3:CreateBucket` | `quicklabs-<USER>-test1` | us-west-2 | ? |
| 2 | `s3:CreateBucket` | `quicklabs-<USER>-test1` | us-east-1 | ? |
| 3 | `s3:CreateBucket` | `quicklabs-someone-else-raw` | us-west-2 | ? |
| 4 | `iam:ChangePassword` | `user/quicklabs-<USER>` | ap-south-1 | ? |

### Console — AWS Policy Simulator

1. Open <https://policysim.aws.amazon.com/>.
2. Left pane → **Users** → pick `quicklabs-<USER>`.
3. Right pane → **Service** → S3 → tick `s3:CreateBucket`.
4. **Run Simulation** with no extra context — see the result.
5. Click **Simulation Settings** → set `aws:RequestedRegion` to `us-east-1`. **Run** again.
6. **Resource ARN** → `arn:aws:s3:::quicklabs-someone-else-raw` for case #3.
7. Switch service to **IAM**, action `iam:ChangePassword`, resource `arn:aws:iam::<ACCT>:user/quicklabs-<USER>`, region `ap-south-1` for case #4.

### CLI

```bash
# Action #1 — own region, own bucket
aws iam simulate-principal-policy \
  --policy-source-arn "arn:aws:iam::${ACCT}:user/quicklabs-${USER}" \
  --action-names s3:CreateBucket \
  --resource-arns "arn:aws:s3:::quicklabs-${USER}-test1" \
  --context-entries "ContextKeyName=aws:RequestedRegion,ContextKeyValues=us-west-2,ContextKeyType=string" \
  --query 'EvaluationResults[].EvalDecision' --output text

# Action #2 — wrong region
aws iam simulate-principal-policy \
  --policy-source-arn "arn:aws:iam::${ACCT}:user/quicklabs-${USER}" \
  --action-names s3:CreateBucket \
  --resource-arns "arn:aws:s3:::quicklabs-${USER}-test1" \
  --context-entries "ContextKeyName=aws:RequestedRegion,ContextKeyValues=us-east-1,ContextKeyType=string" \
  --query 'EvaluationResults[].EvalDecision' --output text

# Action #3 — own region, someone else's prefix
aws iam simulate-principal-policy \
  --policy-source-arn "arn:aws:iam::${ACCT}:user/quicklabs-${USER}" \
  --action-names s3:CreateBucket \
  --resource-arns "arn:aws:s3:::quicklabs-someone-else-raw" \
  --context-entries "ContextKeyName=aws:RequestedRegion,ContextKeyValues=us-west-2,ContextKeyType=string" \
  --query 'EvaluationResults[].EvalDecision' --output text

# Action #4 — IAM in any region (it's global)
aws iam simulate-principal-policy \
  --policy-source-arn "arn:aws:iam::${ACCT}:user/quicklabs-${USER}" \
  --action-names iam:ChangePassword \
  --resource-arns "arn:aws:iam::${ACCT}:user/quicklabs-${USER}" \
  --context-entries "ContextKeyName=aws:RequestedRegion,ContextKeyValues=ap-south-1,ContextKeyType=string" \
  --query 'EvaluationResults[].EvalDecision' --output text
```

### Pass criteria + key insight

| # | Decision | Why |
|---|---|---|
| 1 | **allowed** | `S3CreateOwnBuckets` matches; deny doesn't fire (region equals us-west-2) |
| 2 | **explicit Deny** | `DenyOutsideUSWest2` matches; `s3:CreateBucket` isn't in `NotAction` |
| 3 | **implicit Deny** | No Allow matches that resource ARN; no Deny fires either |
| 4 | **allowed** | `iam:*` is in the `NotAction` exception → deny never applies to IAM (it's a global service) |

> The simulator sometimes labels #2 as `implicitDeny` even though the policy has an explicit Deny — known quirk with the region condition. The real API returns the explicit-deny error message. Trust production, not the simulator label, when conditions are involved.

---

## Exercise 3 — Trace the boundary (10 min)

Fail a call **on purpose** and trace why.

### Console

1. **S3** → **Create bucket** (top-right).
2. Name it `quicklabs-someone-else-raw`. Region us-west-2. Click **Create bucket**.
3. AWS rejects with `User is not authorized to perform: s3:CreateBucket on resource ...`.

### CLI

```bash
aws s3api create-bucket \
  --bucket quicklabs-someone-else-raw \
  --region us-west-2 \
  --create-bucket-configuration LocationConstraint=us-west-2 2>&1 | head -3
```

### Answer (both paths)

1. Was this **explicit deny** or **implicit deny**? *(hint: error wording differs)*
2. Walk through your policy and identify why:
   - Is there an Allow statement matching `s3:CreateBucket` on `arn:aws:s3:::quicklabs-someone-else-raw`?
   - Is there a Deny statement matching it?
3. If you wanted to *let* yourself create that bucket without giving up the boundary on every other bucket, what's the **smallest** change to the policy?

The answer to (3) is in [solutions/solutions.md](solutions/solutions.md).

---

## Exercise 4 — Extend the sandbox (15 min)

You want to grant yourself two new actions you don't currently have: `s3:GetBucketInventoryConfiguration` and `s3:PutBucketInventoryConfiguration`. Scope them to **your own buckets only**.

Open [`starters/ex4-extension.json`](starters/ex4-extension.json) and fill in the blanks.

### Console — AWS Policy Simulator

1. Go to <https://policysim.aws.amazon.com/>.
2. Top of left pane → click **Mode** dropdown → **New Custom Policy Simulation** (or click **New Policy** to create a custom one to test).
3. Paste your completed JSON from `ex4-extension.json` (substitute `{USERNAME}` with your short name).
4. Right pane → service **S3**, tick `GetBucketInventoryConfiguration` and `PutBucketInventoryConfiguration`.
5. **Resource ARN** → first run with `arn:aws:s3:::quicklabs-<USER>-raw`, then again with `arn:aws:s3:::quicklabs-someone-else-raw`.

### CLI

```bash
# Render placeholders, then simulate the inline policy.
POLICY=$(jq -c . starters/ex4-extension.json | sed "s/{USERNAME}/${USER}/g")

aws iam simulate-custom-policy \
  --policy-input-list "$POLICY" \
  --action-names s3:GetBucketInventoryConfiguration s3:PutBucketInventoryConfiguration \
  --resource-arns \
    "arn:aws:s3:::quicklabs-${USER}-raw" \
    "arn:aws:s3:::quicklabs-someone-else-raw" \
  --query 'EvaluationResults[].{Action:EvalActionName,Resource:EvalResourceName,Decision:EvalDecision}' \
  --output table
```

### Pass criteria

- `allowed` for both actions on `quicklabs-${USER}-raw`
- `implicitDeny` for both on `quicklabs-someone-else-raw`

That's the day-one IAM workflow: write a policy → simulate → confirm scope → ship.

Reference: [solutions/ex4-extension-solution.json](solutions/ex4-extension-solution.json).

---

## Exercise 5 — Bucket policy: world-readable `/public/*` (15 min)

Identity-based policies say what your IAM user can do. **Resource-based policies** (bucket policies, role trust policies, KMS key policies, etc.) say who can do what *to a specific resource*. Both apply; AWS takes the union of allows.

You'll attach a bucket policy that lets anyone read objects under `/public/*`, but everything else stays gated.

### Step 1 — Create the bucket and relax the public-access block

#### Console

1. **S3** → **Create bucket**.
2. Name: `quicklabs-<USER>-public`. Region: us-west-2.
3. **Object Ownership**: keep ACLs disabled.
4. **Block Public Access settings for this bucket**: **uncheck** *Block public access through bucket policies* and *Block public access from new public bucket policies*. Keep the two ACL-related blocks **checked**. Acknowledge the warning.
5. **Create bucket**.

#### CLI

```bash
aws s3api create-bucket \
  --bucket "quicklabs-${USER}-public" \
  --region us-west-2 \
  --create-bucket-configuration LocationConstraint=us-west-2

aws s3api put-public-access-block \
  --bucket "quicklabs-${USER}-public" \
  --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=false,RestrictPublicBuckets=false"
```

### Step 2 — Author and apply the bucket policy

Open [`starters/ex5-bucket-policy.json`](starters/ex5-bucket-policy.json), fill in the blanks (`Effect`, `Principal`, `Action`, the prefix in `Resource`).

#### Console

1. **S3** → bucket `quicklabs-<USER>-public` → **Permissions** tab.
2. **Bucket policy** → **Edit**. Paste your JSON (substitute `{USERNAME}` with your short name).
3. **Save changes**. If you see "Bucket policy edits are blocked," step 1 wasn't completed.

#### CLI

```bash
sed "s/{USERNAME}/${USER}/g" starters/ex5-bucket-policy.json > /tmp/bucket-policy.json
aws s3api put-bucket-policy --bucket "quicklabs-${USER}-public" --policy file:///tmp/bucket-policy.json
```

### Step 3 — Test

#### Console

1. **S3** → bucket → **Upload** → drop a `hello.txt` file. Set its **Destination** prefix to `public/`.
2. Click the uploaded object → **Object URL** → open in a fresh **incognito window** (no AWS auth). Should display the file.
3. Repeat the upload with `secret.txt` to prefix `private/`. Open its Object URL incognito → **403 Forbidden**.

#### CLI

```bash
echo "hello world" > /tmp/hello.txt
aws s3 cp /tmp/hello.txt "s3://quicklabs-${USER}-public/public/hello.txt"

# Anonymous read (no AWS auth) — should succeed
curl -sS "https://quicklabs-${USER}-public.s3.us-west-2.amazonaws.com/public/hello.txt"; echo

echo "secret" > /tmp/secret.txt
aws s3 cp /tmp/secret.txt "s3://quicklabs-${USER}-public/private/secret.txt"

# Anonymous read of private prefix — should 403
curl -isS "https://quicklabs-${USER}-public.s3.us-west-2.amazonaws.com/private/secret.txt" | head -1
```

### Pass criteria

- `/public/hello.txt` returns the file contents (or `200 OK` in browser)
- `/private/secret.txt` returns `HTTP/1.1 403 Forbidden`

### Step 4 — Cleanup (do it now, don't leave a public bucket)

```bash
aws s3api delete-bucket-policy --bucket "quicklabs-${USER}-public"
aws s3 rm "s3://quicklabs-${USER}-public" --recursive
aws s3api delete-bucket --bucket "quicklabs-${USER}-public"
```

Or in the Console: bucket → **Permissions** → **Bucket policy** → **Delete**, then empty the bucket and delete it.

Reference: [solutions/ex5-bucket-policy-solution.json](solutions/ex5-bucket-policy-solution.json).

---

## Exercise 6 — Capstone: read-only intern policy (20 min)

Write a policy from scratch (no starter blanks) for a hypothetical "read-only intern" who joins your team. They should be able to:

- List your buckets and read objects, but not modify or delete
- View Glue databases and tables in your namespace, but not create/update/delete
- Run Athena queries through your workgroup, but not change workgroup settings
- See their own IAM user, but not modify other principals
- Region-locked to us-west-2

Draft your policy in [`starters/ex6-intern.json`](starters/ex6-intern.json).

### Verify — Console

1. Policy Simulator → **New Policy** → paste your draft.
2. Run these 8 simulations and check decisions:

| # | Service | Action | Resource ARN | Expected |
|---|---|---|---|---|
| 1 | S3 | `GetObject` | `arn:aws:s3:::quicklabs-<USER>-raw/oil/file.csv` | allowed |
| 2 | S3 | `ListBucket` | `arn:aws:s3:::quicklabs-<USER>-raw` | allowed |
| 3 | Glue | `GetTable` | `arn:aws:glue:us-west-2:<ACCT>:table/quicklabs_<USER>_lake/raw_oil` | allowed |
| 4 | Athena | `GetQueryResults` | `arn:aws:athena:us-west-2:<ACCT>:workgroup/quicklabs-<USER>-wg` | allowed |
| 5 | S3 | `DeleteObject` | `arn:aws:s3:::quicklabs-<USER>-raw/oil/file.csv` | denied (implicit) |
| 6 | Glue | `DeleteTable` | `arn:aws:glue:us-west-2:<ACCT>:table/quicklabs_<USER>_lake/raw_oil` | denied (implicit) |
| 7 | Athena | `UpdateWorkGroup` | `arn:aws:athena:us-west-2:<ACCT>:workgroup/quicklabs-<USER>-wg` | denied (implicit) |
| 8 | IAM | `CreateUser` | `arn:aws:iam::<ACCT>:user/some-other-user` | denied (implicit) |

Set the simulator's `aws:RequestedRegion` to `us-west-2` for all 8.

### Verify — CLI (bash test harness)

```bash
POLICY=$(jq -c . starters/ex6-intern.json | sed "s/{USERNAME}/${USER}/g")

simulate() {
  local action=$1; local resource=$2; local expected=$3
  local result=$(aws iam simulate-custom-policy \
    --policy-input-list "$POLICY" \
    --action-names "$action" \
    --resource-arns "$resource" \
    --context-entries "ContextKeyName=aws:RequestedRegion,ContextKeyValues=us-west-2,ContextKeyType=string" \
    --query 'EvaluationResults[0].EvalDecision' --output text)
  if [[ "$result" == "$expected" ]]; then
    echo "✓ $action on $resource → $result"
  else
    echo "✗ $action on $resource → $result (expected $expected)  — FIX YOUR POLICY"
  fi
}

# Should pass
simulate s3:GetObject  "arn:aws:s3:::quicklabs-${USER}-raw/oil/file.csv"  allowed
simulate s3:ListBucket "arn:aws:s3:::quicklabs-${USER}-raw"               allowed
simulate glue:GetTable "arn:aws:glue:us-west-2:${ACCT}:table/quicklabs_${USER}_lake/raw_oil" allowed
simulate athena:GetQueryResults "arn:aws:athena:us-west-2:${ACCT}:workgroup/quicklabs-${USER}-wg" allowed

# Should be denied
simulate s3:DeleteObject "arn:aws:s3:::quicklabs-${USER}-raw/oil/file.csv"  implicitDeny
simulate glue:DeleteTable "arn:aws:glue:us-west-2:${ACCT}:table/quicklabs_${USER}_lake/raw_oil" implicitDeny
simulate athena:UpdateWorkGroup "arn:aws:athena:us-west-2:${ACCT}:workgroup/quicklabs-${USER}-wg" implicitDeny
simulate iam:CreateUser "arn:aws:iam::${ACCT}:user/some-other-user" implicitDeny
```

### Pass criteria

All 8 lines (or 8 simulator runs in Console) produce the expected decision. ✓ across the board.

This is the real-world IAM authoring loop. You'll do this — write → simulate → fix → re-simulate — on day one of any cloud engineering job that touches IAM.

Reference: [solutions/ex6-intern-solution.json](solutions/ex6-intern-solution.json).

---

## What you've learned

- IAM policy structure: Statement → Effect, Action, Resource, Condition
- Allow/Deny precedence and implicit-deny semantics
- Resource-prefix scoping for multi-tenant accounts
- `NotAction` for "deny-everything-except" patterns
- Identity-based vs resource-based policies (you wrote both)
- AWS Policy Simulator (Console) and `simulate-custom-policy` (CLI)
- The day-one IAM workflow: write → simulate → ship

If you can write a policy and predict its behavior before running it, you've cleared the bar most engineers hit on their first IAM ticket.

---

## Final cleanup

If you skipped the cleanup at the end of ex 5:

```bash
aws s3api delete-bucket-policy --bucket "quicklabs-${USER}-public" || true
aws s3 rm "s3://quicklabs-${USER}-public" --recursive || true
aws s3api delete-bucket --bucket "quicklabs-${USER}-public" || true
```

Other exercises don't create AWS resources — `simulate-custom-policy` and Policy Simulator are free.
