output "s3_bucket" {
  description = "Set this as S3_BUCKET in your .env"
  value       = aws_s3_bucket.photos.id
}

output "dynamodb_table" {
  description = "Set this as DYNAMODB_TABLE in your .env"
  value       = aws_dynamodb_table.inspections.name
}

output "iam_policy_arn" {
  description = "Attach this policy to the IAM user / role running the backend"
  value       = aws_iam_policy.backend.arn
}
