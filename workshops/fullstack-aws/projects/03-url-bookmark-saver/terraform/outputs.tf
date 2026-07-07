output "api_url" {
  description = "API Gateway base URL"
  value       = aws_apigatewayv2_stage.default.invoke_url
}

output "frontend_bucket" {
  description = "S3 bucket name for the frontend"
  value       = aws_s3_bucket.frontend.id
}

output "frontend_url" {
  description = "S3 static website URL (HTTP)"
  value       = "http://${aws_s3_bucket_website_configuration.frontend.website_endpoint}"
}

output "table_name" {
  description = "DynamoDB table name"
  value       = aws_dynamodb_table.bookmarks.name
}

output "function_name" {
  description = "Lambda function name"
  value       = aws_lambda_function.api.function_name
}

output "function_arn" {
  description = "Lambda function ARN"
  value       = aws_lambda_function.api.arn
}

output "dashboard_url" {
  description = "CloudWatch dashboard URL"
  value       = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home#dashboards:name=${aws_cloudwatch_dashboard.stash.dashboard_name}"
}

output "log_group" {
  description = "Lambda CloudWatch log group"
  value       = aws_cloudwatch_log_group.lambda.name
}
