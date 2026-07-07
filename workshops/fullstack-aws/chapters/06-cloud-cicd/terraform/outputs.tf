output "instance_public_ip" {
  description = "Public IP — use this in GitHub Secrets as EC2_HOST"
  value       = aws_instance.app.public_ip
}

output "instance_public_dns" {
  description = "Public DNS of the EC2 instance"
  value       = aws_instance.app.public_dns
}

output "ssh_command" {
  description = "SSH command to connect to the instance"
  value       = "ssh -i ssh-keys/${var.project_name}-key.pem ubuntu@${aws_instance.app.public_ip}"
}

output "app_url" {
  description = "URL to access the deployed app"
  value       = "http://${aws_instance.app.public_ip}"
}

output "private_key_path" {
  description = "Path to the saved private key"
  value       = "ssh-keys/${var.project_name}-key.pem"
}
