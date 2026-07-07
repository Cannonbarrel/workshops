output "frontend_url" {
  description = "S3 static website URL"
  value       = "http://${aws_s3_bucket_website_configuration.frontend.website_endpoint}"
}

output "frontend_bucket" {
  description = "S3 bucket name"
  value       = aws_s3_bucket.frontend.bucket
}
