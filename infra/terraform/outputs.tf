output "instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.skyops.id
}

output "public_ip" {
  description = "Elastic IP address (SSH / direct access)"
  value       = aws_eip.skyops.public_ip
}

output "alb_dns_name" {
  description = "ALB DNS name — create a CNAME from your domain to this value"
  value       = aws_lb.skyops.dns_name
}

output "app_url" {
  description = "Application URL"
  value       = "https://${var.domain_name}"
}

output "ssh_command" {
  description = "SSH one-liner to access the instance"
  value       = "ssh -i ~/.ssh/${var.key_name}.pem ec2-user@${aws_eip.skyops.public_ip}"
}

output "acm_validation_records" {
  description = "Add these DNS records at your registrar to validate the ACM certificate (only shown when hosted_zone_id is not set)"
  value = var.hosted_zone_id == "" ? {
    for dvo in aws_acm_certificate.skyops.domain_validation_options : dvo.domain_name => {
      name  = dvo.resource_record_name
      type  = dvo.resource_record_type
      value = dvo.resource_record_value
    }
  } : {}
}
