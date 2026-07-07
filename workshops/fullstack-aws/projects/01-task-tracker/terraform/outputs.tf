output "cloudfront_url" {
  description = "Frontend URL — open this in your browser"
  value       = "https://${aws_cloudfront_distribution.cdn.domain_name}"
}

output "api_url" {
  description = "API Gateway URL — set as VITE_API_URL in frontend"
  value       = aws_apigatewayv2_stage.default.invoke_url
}

output "s3_bucket" {
  description = "S3 bucket name — used by deploy.sh"
  value       = aws_s3_bucket.frontend.bucket
}

output "lambda_function_name" {
  description = "Lambda function name — used by deploy.sh"
  value       = aws_lambda_function.api.function_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID — used to invalidate cache"
  value       = aws_cloudfront_distribution.cdn.id
}
