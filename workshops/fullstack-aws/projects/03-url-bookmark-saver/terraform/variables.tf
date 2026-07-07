variable "student_name" {
  description = "Unique identifier for the student deployment (lowercase, hyphens only)"
  type        = string
  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.student_name))
    error_message = "student_name must contain only lowercase letters, numbers, and hyphens."
  }
}

variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "us-east-1"
}

variable "lambda_memory_mb" {
  description = "Lambda memory allocation in MB"
  type        = number
  default     = 256
}

variable "lambda_timeout_s" {
  description = "Lambda timeout in seconds"
  type        = number
  default     = 15
}

variable "log_retention_days" {
  description = "CloudWatch log group retention in days"
  type        = number
  default     = 14
}

variable "cohort" {
  description = "Cohort identifier (e.g. fullstack-aws-batch-a). Tagged on every resource for cohort-scoped cleanup."
  type        = string
  default     = "fullstack-aws"
}

locals {
  prefix     = "student-${var.student_name}"
  account_id = data.aws_caller_identity.current.account_id
}
