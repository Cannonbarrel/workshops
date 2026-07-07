###############################################################################
# Full-Stack on AWS — per-cohort IAM bootstrap
#
# Reads students.csv, creates one IAM user per row with:
#   - console login (temporary password, must change on first login)
#   - membership in the cohort group (which holds the sandbox managed policy)
#
# The sandbox policy is created ONCE per cohort and scoped per-user via the
# `slug` principal tag — so the policy text contains ${aws:PrincipalTag/slug}
# and IAM substitutes each user's slug at evaluation.
#
# Multiple cohorts coexist via Terraform workspaces — one workspace per
# cohort, each pointing at its own roster CSV:
#
#   terraform workspace new batch-a
#   terraform apply -var=roster_csv=students-batch-a.csv
#
#   terraform workspace new batch-b
#   terraform apply -var=roster_csv=students-batch-b.csv
#
# The CSV's `cohort` column (same value across all rows in one file) drives
# the group name, managed policy name, and per-user `cohort` tag.
###############################################################################

provider "aws" {
  region = var.region
}

data "aws_caller_identity" "current" {}

locals {
  roster_raw = csvdecode(file(var.roster_csv))

  # username keyed, drop blank rows and inactive students
  students = {
    for s in local.roster_raw : s.username => s
    if try(s.username, "") != "" && lower(try(s.active, "true")) != "false"
  }

  # username is an email; S3/Lambda/DynamoDB names can't contain "@" or ".",
  # so derive a slug (local-part of the email) for resource-name patterns.
  student_slugs = {
    for u, _ in local.students : u => split("@", u)[0]
  }

  # One CSV = one cohort. The group + managed policy are named after the
  # cohort so multiple batches can coexist in AWS (each batch gets its own
  # Terraform workspace/state). Read from the first row; all rows in a file
  # are expected to carry the same value.
  cohort = try(local.roster_raw[0].cohort, "fullstack-aws")
}

# --- IAM user per student ----------------------------------------------------

resource "aws_iam_user" "student" {
  for_each = local.students

  name          = each.key
  force_destroy = true   # removes access keys and MFA devices before deleting the user
  tags = {
    full_name = try(each.value.full_name, "")
    slug      = local.student_slugs[each.key]
    cohort    = try(each.value.cohort, local.cohort)
  }
}

resource "aws_iam_user_login_profile" "student" {
  for_each = aws_iam_user.student

  user                    = each.value.name
  password_reset_required = true

  # TODO: encrypt with a PGP key per student, or write to a sealed secret store.
  # For now Terraform generates a one-time password in state — handle state file
  # accordingly (the parent README's `students-credentials.csv` is gitignored).
}

# --- Sandbox policy + group --------------------------------------------------

resource "aws_iam_policy" "fullstack_sandbox" {
  name        = "${var.name_prefix}-${local.cohort}-sandbox"
  description = "Region + namespace sandbox for ${local.cohort}. Per-user scope via aws:PrincipalTag/slug."

  policy = jsonencode(jsondecode(replace(
    file("${path.module}/../student-user-policy.json"),
    "{ACCOUNT_ID}", data.aws_caller_identity.current.account_id
  )))
}

# Bootcamp-specific extras (tagging, IAM read, API GW console, X-Ray, Logs
# Insights). Split into a second managed policy so the core stays under the
# 6144-char IAM managed-policy limit. Both attach to the same cohort group.
resource "aws_iam_policy" "fullstack_extras" {
  name        = "${var.name_prefix}-${local.cohort}-extras"
  description = "Bootcamp console + tagging + tracing extras for ${local.cohort}."

  policy = jsonencode(jsondecode(replace(
    file("${path.module}/../student-extras-policy.json"),
    "{ACCOUNT_ID}", data.aws_caller_identity.current.account_id
  )))
}

resource "aws_iam_group" "fullstack_student" {
  name = "${var.name_prefix}-${local.cohort}-students"
}

resource "aws_iam_group_policy_attachment" "fullstack_sandbox" {
  group      = aws_iam_group.fullstack_student.name
  policy_arn = aws_iam_policy.fullstack_sandbox.arn
}

resource "aws_iam_group_policy_attachment" "fullstack_extras" {
  group      = aws_iam_group.fullstack_student.name
  policy_arn = aws_iam_policy.fullstack_extras.arn
}

resource "aws_iam_user_group_membership" "student" {
  for_each = aws_iam_user.student

  user   = each.value.name
  groups = [aws_iam_group.fullstack_student.name]
}

# --- Credentials CSV (sensitive) --------------------------------------------
#
# Writes a one-row-per-student CSV that the admin uses to send welcome emails.
# Path is at the repo root and gitignored.

resource "local_sensitive_file" "credentials" {
  filename        = "${path.module}/../../../students-credentials-${local.cohort}.csv"
  file_permission = "0600"

  content = join("\n", concat(
    ["username,full_name,console_url,console_password,region"],
    [
      for u, s in local.students :
      join(",", [
        u,
        try(s.full_name, ""),
        "https://${data.aws_caller_identity.current.account_id}.signin.aws.amazon.com/console",
        aws_iam_user_login_profile.student[u].password,
        var.region,
      ])
    ]
  ))
}
