terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

locals {
  name = "${var.project_name}-${var.student_name}"
}

# ── S3 bucket ──────────────────────────────────────────────────────────────

resource "aws_s3_bucket" "photos" {
  bucket = "${local.name}-photos"
  tags   = { Project = var.project_name, Student = var.student_name }
}

# Block all public access — images are served only via presigned URLs
resource "aws_s3_bucket_public_access_block" "photos" {
  bucket                  = aws_s3_bucket.photos.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 versioning — acts as a compliance / immutability layer on top of
# the timestamp-keyed objects. Each unique key also gets a version ID,
# so you have two independent handles on every photo.
resource "aws_s3_bucket_versioning" "photos" {
  bucket = aws_s3_bucket.photos.id
  versioning_configuration { status = "Enabled" }
}

# CORS — required for browser → S3 direct upload via presigned PUT URL
resource "aws_s3_bucket_cors_configuration" "photos" {
  bucket = aws_s3_bucket.photos.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT"]
    allowed_origins = ["*"]     # lock to your frontend domain in production
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# ── DynamoDB table ─────────────────────────────────────────────────────────

resource "aws_dynamodb_table" "inspections" {
  name         = local.name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "equipment_id"
  range_key    = "component_ts"

  attribute {
    name = "equipment_id"
    type = "S"
  }
  attribute {
    name = "component_ts"
    type = "S"
  }

  tags = { Project = var.project_name, Student = var.student_name }
}

# ── IAM policy for the backend process ─────────────────────────────────────

resource "aws_iam_policy" "backend" {
  name = "${local.name}-backend-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "S3Access"
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:ListBucket",
        ]
        Resource = [
          aws_s3_bucket.photos.arn,
          "${aws_s3_bucket.photos.arn}/*",
        ]
      },
      {
        Sid    = "DynamoDBAccess"
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:UpdateItem",
        ]
        Resource = aws_dynamodb_table.inspections.arn
      },
    ]
  })
}
