# AWS IAM Policy Lab

A hands-on lab that teaches students to read, predict, and write AWS IAM policies — using **their own sandbox policy** from the AWS Data Lake lab as the textbook.

## Prereqs for students

- Completed (or alongside) the [aws-data-lake](../aws-data-lake/) lab — they need:
  - A `quicklabs-<USER>` IAM user + console password
  - Their `quicklabs-<USER>-data-lake-sandbox` policy (auto-created by `terraform-iam`)
  - At least one of their `quicklabs-<USER>-*` S3 buckets (for the bucket-policy exercise)
- AWS CLI configured locally with the student's credentials (or run from CloudShell — it picks up the console identity automatically)

## What the lab teaches (mapped to real concepts)

| Exercise | Concept | Where it shows up in production |
|---|---|---|
| 1 — Inventory | Reading a JSON policy, identifying Sids, Allow vs Deny | Every policy review |
| 2 — Predict the deny | `Effect: Deny` + `Condition` precedence | Region-locked workloads |
| 3 — Trace the boundary | Resource-prefix scoping, implicit deny | Multi-tenant accounts |
| 4 — Extend the sandbox | Writing a new `Allow` statement, testing with simulator | Day-one IAM work |
| 5 — Bucket policy | Resource-based policy, `Principal: "*"`, public access blocks | Public assets, log delivery |
| 6 — Capstone: read-only intern | Writing a policy from scratch + simulating | Onboarding contractors / read-only auditors |

## Files

| File | Audience |
|---|---|
| [`student-lab.md`](student-lab.md) | The lab — hand this to students |
| [`starters/`](starters/) | Skeleton policy JSONs students fill in |
| [`solutions/`](solutions/) | Reference policies and a per-exercise explanation. Don't share until students attempt — read it after if they want to compare. |

## Running it

Students need nothing from you that isn't already provisioned by the data lake lab. Hand them the `student-lab.md` link and they self-drive. Each exercise has a clear verification step using `aws iam simulate-custom-policy` (free, no resources created) — they'll know if they got it right.

Time-box: 60 minutes for exercises 1–4, +30 minutes for 5–6 if you want to cover bucket policies and a capstone. The lab is designed so it's fine to stop after ex4 — that already covers the load-bearing concepts.

## Grading / verification

The simulator's pass/fail is the grade. There's nothing to attest manually. If a student's exercise 4 simulator returns `allowed` for the test case that should be `allowed` and `implicitDeny` for the one that shouldn't, they got it. The [solutions/](solutions/) directory has the policies that pass.

## Cleanup

Nothing to clean up — exercises 1–4 don't create AWS resources. Exercise 5 attaches a bucket policy to one of the student's existing buckets; tell them to remove it at the end:

```bash
aws s3api delete-bucket-policy --bucket quicklabs-<USER>-public
```
