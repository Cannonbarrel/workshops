terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.0"
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

locals {
  # All resources prefixed student-<slug>-<project>- so they fit the IAM
  # namespace policy and are pickable by the cleanup script.
  name = "student-${var.student_name}-${var.project_name}"
}

# ─────────────────────────────────────────────
# SSH Key Pair
# ─────────────────────────────────────────────

# Generate RSA private key
resource "tls_private_key" "ec2_key" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

# Register public key with AWS
resource "aws_key_pair" "ec2_key" {
  key_name   = "${local.name}-key"
  public_key = tls_private_key.ec2_key.public_key_openssh
}

# Save private key to ssh-keys/ folder with correct permissions
resource "local_sensitive_file" "private_key" {
  content         = tls_private_key.ec2_key.private_key_pem
  filename        = "${path.module}/ssh-keys/${local.name}-key.pem"
  file_permission = "0400"
}

# ─────────────────────────────────────────────
# Security Group
# ─────────────────────────────────────────────

resource "aws_security_group" "ec2" {
  name        = "${local.name}-sg"
  description = "Security group for ${local.name} EC2 instance"

  # SSH — for deployment and management
  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTP — nginx serves the React app
  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTPS — for future SSL setup
  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # FastAPI — direct access for testing/debugging
  ingress {
    description = "FastAPI"
    from_port   = 8000
    to_port     = 8000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # MongoDB — direct access for Lambda and testing
  ingress {
    description = "MongoDB"
    from_port   = 27017
    to_port     = 27017
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name    = "${local.name}-sg"
    Project = local.name
  }
}

# Egress as a separate resource — avoids ec2:RevokeSecurityGroupEgress on the default rule
resource "aws_vpc_security_group_egress_rule" "allow_all" {
  security_group_id = aws_security_group.ec2.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}

# ─────────────────────────────────────────────
# AMI — Latest Ubuntu 22.04 LTS
# ─────────────────────────────────────────────

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical (Ubuntu)

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# ─────────────────────────────────────────────
# EC2 Instance
# ─────────────────────────────────────────────

resource "aws_instance" "app" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  key_name               = aws_key_pair.ec2_key.key_name
  vpc_security_group_ids = [aws_security_group.ec2.id]

  # Install base dependencies on first boot
  user_data = <<-EOF
    #!/bin/bash
    apt-get update -y
    apt-get upgrade -y

    # Python
    apt-get install -y python3 python3-pip python3-venv

    # Node.js 18
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs

    # nginx and git
    apt-get install -y nginx git

    # Allow ubuntu user to manage services without password
    echo "ubuntu ALL=(ALL) NOPASSWD: /bin/systemctl restart fastapi, /bin/systemctl reload nginx, /bin/cp -r * /var/www/html/" >> /etc/sudoers

    systemctl enable nginx
    systemctl start nginx
  EOF

  tags = {
    Name    = "${local.name}-server"
    Project = local.name
  }
}
