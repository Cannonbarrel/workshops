variable "student_name" {
  description = "Your name in lowercase with no spaces (e.g. john-smith). Used to identify your resources."

  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.student_name))
    error_message = "student_name must be lowercase letters, numbers, and hyphens only (e.g. john-smith)."
  }
}

variable "project_name" {
  description = "Project name — combined with student_name to form resource names"
  default     = "task-tracker"
}

variable "aws_region" {
  default = "us-east-1"
}

variable "mongo_host" {
  description = "EC2 public IP running MongoDB"
}

variable "cohort" {
  description = "Cohort identifier (e.g. fullstack-aws-batch-a). Tagged on every resource for cohort-scoped cleanup."
  type        = string
  default     = "fullstack-aws"
}
