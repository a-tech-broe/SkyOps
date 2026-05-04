output "instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.skyops.id
}

output "public_ip" {
  description = "Elastic IP address (SSH / direct access)"
  value       = data.aws_eip.skyops.public_ip
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
  value       = "ssh -i ~/.ssh/${var.key_name}.pem ec2-user@${data.aws_eip.skyops.public_ip}"
}

output "app_private_ip" {
  description = "App EC2 private IP (VPC-internal — used by Prometheus to scrape exporters)"
  value       = aws_instance.skyops.private_ip
}

output "monitoring_public_ip" {
  description = "Monitoring EC2 Elastic IP"
  value       = data.aws_eip.monitoring.public_ip
}

output "grafana_url" {
  description = "Grafana dashboard URL"
  value       = "http://${data.aws_eip.monitoring.public_ip}:3000"
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
