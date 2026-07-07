# ── DynamoDB ──────────────────────────────────────────────────

resource "aws_dynamodb_table" "bookmarks" {
  name         = "${local.prefix}-bookmarks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }
}

# ── IAM ───────────────────────────────────────────────────────

resource "aws_iam_role" "lambda" {
  name = "${local.prefix}-lambda-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "lambda_dynamodb" {
  name = "${local.prefix}-dynamo-policy"
  role = aws_iam_role.lambda.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "dynamodb:Scan",
        "dynamodb:PutItem",
        "dynamodb:DeleteItem",
        "dynamodb:GetItem",
      ]
      Resource = aws_dynamodb_table.bookmarks.arn
    }]
  })
}

# ── CloudWatch log group ──────────────────────────────────────

resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${local.prefix}-api"
  retention_in_days = var.log_retention_days
}

# ── Lambda ────────────────────────────────────────────────────

resource "aws_lambda_function" "api" {
  function_name = "${local.prefix}-api"
  role          = aws_iam_role.lambda.arn
  runtime       = "nodejs20.x"
  handler       = "src/handler.handler"
  filename      = "${path.module}/../backend/lambda.zip"
  timeout       = var.lambda_timeout_s
  memory_size   = var.lambda_memory_mb

  source_code_hash = filebase64sha256("${path.module}/../backend/lambda.zip")

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.bookmarks.name
    }
  }

  depends_on = [aws_cloudwatch_log_group.lambda]
}

# ── API Gateway HTTP API ──────────────────────────────────────

resource "aws_apigatewayv2_api" "api" {
  name          = "${local.prefix}-api"
  protocol_type = "HTTP"
  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["GET", "POST", "DELETE", "OPTIONS"]
    allow_headers = ["Content-Type", "Authorization"]
    max_age       = 86400
  }
}

resource "aws_apigatewayv2_integration" "lambda" {
  api_id                 = aws_apigatewayv2_api.api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.api.invoke_arn
  payload_format_version = "1.0"
}

resource "aws_apigatewayv2_route" "get_bookmarks" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "GET /bookmarks"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "post_bookmarks" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "POST /bookmarks"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "delete_bookmark" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "DELETE /bookmarks/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "options" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "OPTIONS /{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.api.id
  name        = "$default"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.apigw.arn
    format = jsonencode({
      requestId          = "$context.requestId"
      ip                 = "$context.identity.sourceIp"
      requestTime        = "$context.requestTime"
      httpMethod         = "$context.httpMethod"
      routeKey           = "$context.routeKey"
      status             = "$context.status"
      responseLength     = "$context.responseLength"
      integrationLatency = "$context.integrationLatency"
    })
  }
}

resource "aws_cloudwatch_log_group" "apigw" {
  name              = "/aws/apigateway/${local.prefix}"
  retention_in_days = var.log_retention_days
}

resource "aws_cloudwatch_log_metric_filter" "bookmark_created" {
  name           = "${local.prefix}-bookmark-created"
  log_group_name = aws_cloudwatch_log_group.lambda.name
  pattern        = "{ $.message = \"Bookmark created\" }"

  metric_transformation {
    name      = "BookmarkCreatedCount"
    namespace = "StashApp/${local.prefix}"
    value     = "1"
  }
}

resource "aws_cloudwatch_log_metric_filter" "bookmark_deleted" {
  name           = "${local.prefix}-bookmark-deleted"
  log_group_name = aws_cloudwatch_log_group.lambda.name
  pattern        = "{ $.message = \"Bookmark deleted\" }"

  metric_transformation {
    name      = "BookmarkDeletedCount"
    namespace = "StashApp/${local.prefix}"
    value     = "1"
  }
}

resource "aws_cloudwatch_log_metric_filter" "bookmark_fetch" {
  name           = "${local.prefix}-bookmark-fetch"
  log_group_name = aws_cloudwatch_log_group.lambda.name
  pattern        = "{ $.message = \"Bookmarks fetched\" }"

  metric_transformation {
    name      = "BookmarkFetchCount"
    namespace = "StashApp/${local.prefix}"
    value     = "1"
  }
}

resource "aws_cloudwatch_log_metric_filter" "lambda_unhandled_error" {
  name           = "${local.prefix}-lambda-unhandled-error"
  log_group_name = aws_cloudwatch_log_group.lambda.name
  pattern        = "{ $.message = \"Unhandled error\" }"

  metric_transformation {
    name      = "UnhandledErrorCount"
    namespace = "StashApp/${local.prefix}"
    value     = "1"
  }
}

resource "aws_lambda_permission" "apigw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api.execution_arn}/*/*"
}

# ── S3 frontend hosting ───────────────────────────────────────

resource "aws_s3_bucket" "frontend" {
  bucket        = "${local.prefix}-frontend-${local.account_id}"
  force_destroy = true
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket                  = aws_s3_bucket.frontend.id
  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_website_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  index_document { suffix = "index.html" }
  error_document { key = "index.html" }
}

resource "aws_s3_bucket_policy" "frontend" {
  depends_on = [aws_s3_bucket_public_access_block.frontend]
  bucket     = aws_s3_bucket.frontend.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "PublicReadGetObject"
      Effect    = "Allow"
      Principal = "*"
      Action    = "s3:GetObject"
      Resource  = "${aws_s3_bucket.frontend.arn}/*"
    }]
  })
}

# ── CloudWatch dashboard ──────────────────────────────────────

resource "aws_cloudwatch_dashboard" "stash" {
  dashboard_name = "${local.prefix}-dashboard"
  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 6
        height = 6
        properties = {
          title   = "API Requests"
          metrics = [["AWS/ApiGateway", "Count", "ApiId", aws_apigatewayv2_api.api.id]]
          period  = 300
          stat    = "Sum"
          view    = "singleValue"
          region  = var.aws_region
        }
      },
      {
        type   = "metric"
        x      = 6
        y      = 0
        width  = 6
        height = 6
        properties = {
          title   = "Bookmarks Created"
          metrics = [["StashApp/${local.prefix}", "BookmarkCreatedCount"]]
          period  = 300
          stat    = "Sum"
          view    = "singleValue"
          region  = var.aws_region
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 6
        height = 6
        properties = {
          title   = "Bookmarks Deleted"
          metrics = [["StashApp/${local.prefix}", "BookmarkDeletedCount"]]
          period  = 300
          stat    = "Sum"
          view    = "singleValue"
          region  = var.aws_region
        }
      },
      {
        type   = "metric"
        x      = 18
        y      = 0
        width  = 6
        height = 6
        properties = {
          title = "HTTP Error Mix"
          metrics = [
            ["AWS/ApiGateway", "4xxError", "ApiId", aws_apigatewayv2_api.api.id, { label = "4XX", color = "#ff9900" }],
            [".", "5xxError", ".", ".", { label = "5XX", color = "#d13212" }]
          ]
          period = 300
          stat   = "Sum"
          view   = "singleValue"
          region = var.aws_region
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          title   = "Lambda — Invocations"
          metrics = [["AWS/Lambda", "Invocations", "FunctionName", aws_lambda_function.api.function_name]]
          period  = 60
          stat    = "Sum"
          view    = "timeSeries"
          region  = var.aws_region
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        properties = {
          title   = "Lambda — Errors"
          metrics = [["AWS/Lambda", "Errors", "FunctionName", aws_lambda_function.api.function_name]]
          period  = 60
          stat    = "Sum"
          view    = "timeSeries"
          region  = var.aws_region
          color   = "#d13212"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 12
        width  = 12
        height = 6
        properties = {
          title   = "Lambda — Duration (p99 ms)"
          metrics = [["AWS/Lambda", "Duration", "FunctionName", aws_lambda_function.api.function_name]]
          period  = 60
          stat    = "p99"
          view    = "timeSeries"
          region  = var.aws_region
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 12
        width  = 12
        height = 6
        properties = {
          title   = "API Gateway — Latency (ms)"
          metrics = [["AWS/ApiGateway", "Latency", "ApiId", aws_apigatewayv2_api.api.id]]
          period  = 60
          stat    = "p99"
          view    = "timeSeries"
          region  = var.aws_region
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 18
        width  = 12
        height = 6
        properties = {
          title   = "API Gateway — 4XX Errors"
          metrics = [["AWS/ApiGateway", "4xxError", "ApiId", aws_apigatewayv2_api.api.id]]
          period  = 60
          stat    = "Sum"
          view    = "timeSeries"
          region  = var.aws_region
          color   = "#ff7f0e"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 18
        width  = 12
        height = 6
        properties = {
          title   = "API Gateway — 5XX Errors"
          metrics = [["AWS/ApiGateway", "5xxError", "ApiId", aws_apigatewayv2_api.api.id]]
          period  = 60
          stat    = "Sum"
          view    = "timeSeries"
          region  = var.aws_region
          color   = "#d13212"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 24
        width  = 12
        height = 6
        properties = {
          title = "Bookmark Activity"
          metrics = [
            ["StashApp/${local.prefix}", "BookmarkCreatedCount", { label = "Created", color = "#1f77b4" }],
            [".", "BookmarkDeletedCount", { label = "Deleted", color = "#d62728" }],
            [".", "BookmarkFetchCount", { label = "Fetched", color = "#2ca02c" }]
          ]
          period  = 300
          stat    = "Sum"
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 24
        width  = 12
        height = 6
        properties = {
          title = "DynamoDB Activity"
          metrics = [
            ["AWS/DynamoDB", "ConsumedWriteCapacityUnits", "TableName", aws_dynamodb_table.bookmarks.name, { label = "Writes" }],
            [".", "ConsumedReadCapacityUnits", ".", ".", { label = "Reads" }],
            [".", "SuccessfulRequestLatency", ".", ".", "Operation", "PutItem", { label = "PutItem Latency", yAxis = "right" }],
            [".", "SuccessfulRequestLatency", ".", ".", "Operation", "Scan", { label = "Scan Latency", yAxis = "right" }]
          ]
          period = 300
          stat   = "Sum"
          view   = "timeSeries"
          region = var.aws_region
        }
      },
      {
        type   = "log"
        x      = 0
        y      = 30
        width  = 24
        height = 6
        properties = {
          title         = "Recent Lambda Events"
          region        = var.aws_region
          view          = "table"
          logGroupNames = [aws_cloudwatch_log_group.lambda.name]
          query         = "fields @timestamp, level, message, method, path, id, count, durationMs\n| sort @timestamp desc\n| limit 20"
        }
      }
    ]
  })
}
