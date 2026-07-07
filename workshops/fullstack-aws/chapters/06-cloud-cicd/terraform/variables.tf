variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "student_name" {
  description = "Your slug (lowercase letters, numbers, hyphens). Same value as your IAM user's slug tag and what other projects use as student_name."
  type        = string
  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.student_name))
    error_message = "student_name must contain only lowercase letters, numbers, and hyphens."
  }
}

variable "cohort" {
  description = "Cohort identifier (e.g. fullstack-aws-batch-a). Tagged on every resource for cohort-scoped cleanup."
  type        = string
  default     = "fullstack-aws"
}

variable "project_name" {
  description = "Suffix combined with the student slug to form resource names: student-<student_name>-<project_name>-*"
  type        = string
  default     = "employee-app"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t2.micro"
}
