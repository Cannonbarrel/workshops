# Admin walkthrough — Full-Stack on AWS

End-to-end the instructor runs once per cohort, before students arrive.

See [`README.md`](README.md) for the design overview (slug derivation, group/policy model, multi-cohort workspaces). This doc is the runbook.

## Prereqs

- AWS CLI configured with admin creds for the cohort account (`aws sts get-caller-identity` works)
- Terraform ≥ 1.5 (`brew install terraform`)
- `gh` CLI authenticated as an org owner of `{ORG}` (`gh auth status`)
- The cohort's GitHub team exists (`gh api /orgs/{ORG}/teams/{TEAM_SLUG}` returns 200)
- A Copilot Business subscription on the org with seats available

## Step 0 — Roster

One CSV per cohort. Columns: `username,full_name,cohort`. All rows in one file share the same cohort value.

```bash
cd labs/fullstack-aws/terraform-iam
cp students.csv.example students.csv
$EDITOR students.csv
```

Example row:

```csv
username,full_name,cohort
alice-johnson@quicklabs.internal,Alice Johnson,fullstack-aws-batch-a
```

For a second cohort, keep a parallel file (`students-batch-b.csv`) and pass it via `-var=roster_csv=...` on apply.

## Step 1 — GitHub: team + Copilot

Independent of the AWS side. Maintain GitHub handles in your own roster (the AWS CSV no longer carries them).

```bash
cd ../github

# 1a. Invite all students to the cohort team.
ORG=becloudready TEAM_SLUG=fullstack-cohort-01 ./add-team-members.sh github-roster.csv

# 1b. Assign Copilot seats.
ORG=becloudready ./invite-copilot.sh github-roster.csv
```

Both scripts are idempotent — re-run them to add late joiners.

## Step 2 — AWS: IAM users + sandbox policy + group

Per-cohort Terraform workspace. One workspace = one cohort = one isolated state file.

```bash
cd ../terraform-iam
terraform init                               # one-time
terraform workspace new batch-a              # one-time per cohort
terraform apply                              # uses students.csv
```

For batch B later:

```bash
terraform workspace new batch-b
terraform apply -var=roster_csv=students-batch-b.csv
```

What got created per cohort (`<cohort>` = the value in the CSV's `cohort` column):

- Managed policy `quicklabs-<cohort>-sandbox` — core sandbox, scoped per-user via `${aws:PrincipalTag/slug}`
- Managed policy `quicklabs-<cohort>-extras` — bootcamp extras (Tagging API, IAM read, API GW console, X-Ray, Logs Insights). Both files are loaded because the combined JSON exceeds the IAM 6144-char single-policy limit.
- IAM group `quicklabs-<cohort>-students` with both managed policies attached
- One IAM user per CSV row, named with the email-form `username`, tagged with `slug` + `full_name` + `cohort`
- Per-user login profile (20-char password, reset required on first login)
- Per-user group membership

Outputs:

- `terraform output -json students` — sensitive map (scriptable)
- `students-credentials-<cohort>.csv` at the repo root (chmod 0600, gitignored) — `username, full_name, console_url, console_password, region`. Filename is cohort-aware, so batch A and batch B write to separate files automatically.

## Step 3 — Distribute credentials

The output file path is exposed as a Terraform output so you don't have to guess the cohort suffix:

```bash
cd labs/fullstack-aws/terraform-iam
CREDS_FILE=$(terraform output -raw credentials_csv_path)

while IFS=, read -r username full_name console_url console_password region; do
  [[ "$username" == "username" ]] && continue
  cat <<EOF
to: $username
  GitHub:     accept the invite to {ORG}/{TEAM_SLUG} and the Copilot seat (check your email)
  AWS console: $console_url
  username:   $username
  password:   $console_password   (must change on first login)
  region:     $region (anything else is denied)
  Your slug:  ${username%@*}
              (use this as student_name= when running bootcamp Terraform)

EOF
done < "$CREDS_FILE"
```

## Step 4 — Smoke test (one student, incognito)

| Test | Expected |
|---|---|
| GitHub: sign in, see {ORG}/{TEAM_SLUG} repos | ✅ |
| GitHub: open VS Code, Copilot suggests inline | ✅ |
| AWS: sign in to console in `us-east-1` | ✅ |
| AWS: switch to `us-west-2`, open any service | mostly denied |
| AWS: create S3 bucket `student-<slug>-test` | ✅ |
| AWS: create S3 bucket without the `student-<slug>-` prefix | ❌ denied |
| AWS: try to create another IAM user | ❌ denied |
| AWS: launch a `t3.medium` EC2 instance | ❌ denied (only micro allowed) |
| AWS: launch a `t3.micro` EC2 instance | ✅ |
| Terraform: `cd projects/01-task-tracker/terraform && terraform apply -var=student_name=<slug> ...` | ✅ |

Each failed expectation → one edit to `student-user-policy.json` → `terraform apply` to re-render the managed policy.

## Cohort teardown

Two-phase: tear down the student-built lab resources first, then the IAM scaffolding.

```bash
# 1. Lab resources students built during the bootcamp (Lambda, S3, DynamoDB, EC2, log groups, IAM roles)
#    The cleanup script keys on the student-<slug>-* prefix and works per-slug.
cd ~/workspace/fullstack-bootcamp
while IFS=, read -r username _; do
  [[ "$username" == "username" ]] && continue
  slug="${username%@*}"
  python tools/cleanup-student-resources.py --student "$slug" --region us-east-1
done < ~/workspace/quick-labs/labs/fullstack-aws/terraform-iam/students.csv

# 2. IAM scaffolding for this cohort (users, group, managed policy, memberships)
cd ~/workspace/quick-labs/labs/fullstack-aws/terraform-iam
terraform workspace select batch-a
terraform destroy

# 3. GitHub — remove from team + revoke Copilot seats (skips active=true rows).
cd ../github
ORG=becloudready TEAM_SLUG=fullstack-cohort-01 ./remove-team-members.sh github-roster.csv
ORG=becloudready ./revoke-copilot.sh github-roster.csv
```

Order matters: destroy lab resources first while students still have permissions to inspect what's there if needed, then yank the IAM scaffolding.
