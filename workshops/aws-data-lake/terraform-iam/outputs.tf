output "console_url" {
  value = "https://${data.aws_caller_identity.current.account_id}.signin.aws.amazon.com/console"
}

output "students" {
  description = "Per-student credentials. Sensitive — contains plaintext passwords."
  sensitive   = true
  value = {
    for u, user in aws_iam_user.student : u => {
      username         = user.name
      full_name        = try(local.students[u].full_name, "")
      email            = try(local.students[u].email, "")
      console_url      = "https://${data.aws_caller_identity.current.account_id}.signin.aws.amazon.com/console"
      console_password = try(aws_iam_user_login_profile.student[u].password, "")
    }
  }
}

# Credentials CSV written next to the module — email rows to students after apply.
# chmod 0600, gitignored.
resource "local_sensitive_file" "credentials" {
  filename        = "${path.module}/students-credentials.csv"
  file_permission = "0600"
  content = join("\n", concat(
    ["username,full_name,email,console_url,console_password"],
    [for u, user in aws_iam_user.student :
      format("%s,%s,%s,%s,%s",
        user.name,
        try(local.students[u].full_name, ""),
        try(local.students[u].email, ""),
        "https://${data.aws_caller_identity.current.account_id}.signin.aws.amazon.com/console",
        aws_iam_user_login_profile.student[u].password == null ? "" : aws_iam_user_login_profile.student[u].password,
      )
    ],
  ))
}
