variable "student_name" {
  description = "Unique name/ID for this deployment (lowercase letters, numbers, hyphens only)"
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

variable "cohort" {
  description = "Cohort identifier (e.g. fullstack-aws-batch-a). Tagged on every resource for cohort-scoped cleanup."
  type        = string
  default     = "fullstack-aws"
}
