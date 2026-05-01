output "instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.skyops.id
}

output "public_ip" {
  description = "Elastic IP address"
  value       = aws_eip.skyops.public_ip
}

output "app_url" {
  description = "Application URL"
  value       = "http://${aws_eip.skyops.public_ip}"
}

output "ssh_command" {
  description = "SSH one-liner to access the instance"
  value       = "ssh -i ~/.ssh/${var.key_name}.pem ec2-user@${aws_eip.skyops.public_ip}"
}
