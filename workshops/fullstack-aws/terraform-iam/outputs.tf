output "students" {
  description = "Per-student onboarding bundle (sensitive — contains console passwords)."
  sensitive   = true
  value = {
    for u, s in local.students : u => {
      iam_user           = aws_iam_user.student[u].name
      console_url        = "https://${data.aws_caller_identity.current.account_id}.signin.aws.amazon.com/console"
      console_password   = aws_iam_user_login_profile.student[u].password
      region             = var.region
      full_name          = try(s.full_name, "")
      resource_name_slug = local.student_slugs[u]
    }
  }
}

output "credentials_csv_path" {
  description = "Where the welcome-email-ready CSV was written."
  value       = local_sensitive_file.credentials.filename
}
