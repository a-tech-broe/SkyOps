variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.small"
}

variable "key_name" {
  description = "Name of an existing EC2 key pair for SSH access"
  type        = string
}

variable "allowed_ssh_cidr" {
  description = "CIDR allowed to SSH — tighten to your IP in production"
  type        = string
  default     = "0.0.0.0/0"
}

variable "dockerhub_username" {
  description = "Docker Hub username (images pulled as <username>/skyops-backend, skyops-web)"
  type        = string
}

variable "app_image_tag" {
  description = "Docker image tag to deploy (e.g. latest, sha-abc1234)"
  type        = string
  default     = "latest"
}

variable "ssm_prefix" {
  description = "SSM Parameter Store path prefix for app secrets"
  type        = string
  default     = "/skyops"
}
