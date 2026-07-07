variable "region" {
  description = "AWS region the lab is locked to."
  type        = string
  default     = "us-east-1"
}

variable "roster_csv" {
  description = "Path to the cohort roster CSV. Columns: username (email),full_name,cohort. One file = one cohort; all rows share the same cohort value."
  type        = string
  default     = "students.csv"
}

variable "name_prefix" {
  description = "Prefix on the cohort-level IAM group + managed policy: <prefix>-<cohort>-..."
  type        = string
  default     = "quicklabs"
}
