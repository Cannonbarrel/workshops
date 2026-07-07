provider "aws" {
  region = var.region
  default_tags {
    tags = {
      Project = "Quicklabs"
      Lab     = "aws-data-lake"
    }
  }
}

data "aws_caller_identity" "current" {}

locals {
  students_list = csvdecode(file(var.students_csv))
  students      = { for s in local.students_list : s.username => s }
}

# IAM group — policies and roles are attached manually via the console
resource "aws_iam_group" "datalake_students" {
  name = "datalake_student_group"
}

# One IAM user per student
resource "aws_iam_user" "student" {
  for_each      = local.students
  name          = "quicklabs-${each.key}"
  force_destroy = true

  tags = merge(
    { Student = each.key },
    try(each.value.full_name, "") != "" ? { FullName = each.value.full_name } : {},
    try(each.value.email, "")    != "" ? { Email    = each.value.email }    : {},
  )
}

# Console login with a generated password (student must reset on first sign-in)
resource "aws_iam_user_login_profile" "student" {
  for_each                = local.students
  user                    = aws_iam_user.student[each.key].name
  password_reset_required = true
  password_length         = 16

  lifecycle {
    ignore_changes = [password_length, password_reset_required]
  }
}

# Add all students to the group
resource "aws_iam_group_membership" "datalake_students" {
  name  = "datalake-student-group-membership"
  group = aws_iam_group.datalake_students.name
  users = [for u in aws_iam_user.student : u.name]
}
