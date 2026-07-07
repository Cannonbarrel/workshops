terraform {
  required_version = ">= 1.3"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      student = var.student_name
      cohort  = var.cohort
    }
  }
}

data "aws_caller_identity" "current" {}
