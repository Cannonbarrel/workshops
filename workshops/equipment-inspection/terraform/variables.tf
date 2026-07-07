variable "aws_region" {
  default = "us-east-1"
}

variable "project_name" {
  default = "equipment-inspection"
}

variable "student_name" {
  description = "Your student slug (e.g. alice-johnson). Used to namespace all resources."
}
