output "instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.skybroe.id
}

output "public_ip" {
  description = "Elastic IP address (SSH / direct access)"
  value       = data.aws_eip.skybroe.public_ip
}

output "alb_dns_name" {
  description = "ALB DNS name — create a CNAME from your domain to this value"
  value       = aws_lb.skybroe.dns_name
}

output "app_url" {
  description = "Application URL"
  value       = "https://${var.domain_name}"
}

output "ssh_command" {
  description = "SSH one-liner to access the instance"
  value       = "ssh -i ~/.ssh/${var.key_name}.pem ec2-user@${data.aws_eip.skybroe.public_ip}"
}

output "acm_validation_records" {
  description = "Add these DNS records at your registrar to validate the ACM certificate (only shown when hosted_zone_id is not set)"
  value = var.hosted_zone_id == "" ? {
    for dvo in aws_acm_certificate.skybroe.domain_validation_options : dvo.domain_name => {
      name  = dvo.resource_record_name
      type  = dvo.resource_record_type
      value = dvo.resource_record_value
    }
  } : {}
}

output "rum_app_monitor_id" {
  description = "CloudWatch RUM app monitor ID — set as VITE_RUM_APP_ID in the web build"
  value       = aws_rum_app_monitor.skybroe.id
}

output "rum_identity_pool_id" {
  description = "Cognito Identity Pool ID for CloudWatch RUM — set as VITE_RUM_IDENTITY_POOL_ID in the web build"
  value       = aws_cognito_identity_pool.rum.id
}

output "cloudwatch_dashboard_url" {
  description = "CloudWatch dashboard URL"
  value       = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=SkyBroe-Overview"
}
