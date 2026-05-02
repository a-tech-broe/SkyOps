# ── Default VPC + Internet Gateway ───────────────────────────────
data "aws_vpc" "default" {
  default = true
}

resource "aws_internet_gateway" "skyops" {
  vpc_id = data.aws_vpc.default.id
  tags   = { Name = "skyops-igw" }
}

# ── Main route table — clears blackhole, routes internet via IGW ──
data "aws_route_table" "main" {
  vpc_id = data.aws_vpc.default.id
  filter {
    name   = "association.main"
    values = ["true"]
  }
}

resource "aws_route" "internet" {
  route_table_id         = data.aws_route_table.main.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.skyops.id
}

# ── AMI — latest Amazon Linux 2023 x86_64 ────────────────────────
data "aws_ami" "al2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# ── IAM role — EC2 reads SSM secrets at boot ─────────────────────
resource "aws_iam_role" "skyops_ec2" {
  name = "skyops-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "ssm_read" {
  name = "skyops-ssm-read"
  role = aws_iam_role.skyops_ec2.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "ssm:GetParameter",
        "ssm:GetParameters"
      ]
      Resource = "arn:aws:ssm:${var.aws_region}:*:parameter${var.ssm_prefix}/*"
    }]
  })
}

resource "aws_iam_instance_profile" "skyops_ec2" {
  name = "skyops-ec2-profile"
  role = aws_iam_role.skyops_ec2.name
}

# ── Security group ────────────────────────────────────────────────
resource "aws_security_group" "skyops" {
  name        = "skyops-sg"
  description = "SkyOps: HTTP + HTTPS inbound, SSH restricted"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description     = "Backend API from ALB"
    from_port       = 3001
    to_port         = 3001
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description     = "Prometheus scrape — backend /metrics"
    from_port       = 3001
    to_port         = 3001
    protocol        = "tcp"
    security_groups = [aws_security_group.monitoring.id]
  }

  ingress {
    description     = "Prometheus scrape — node-exporter"
    from_port       = 9100
    to_port         = 9100
    protocol        = "tcp"
    security_groups = [aws_security_group.monitoring.id]
  }

  ingress {
    description     = "Prometheus scrape — cAdvisor"
    from_port       = 8082
    to_port         = 8082
    protocol        = "tcp"
    security_groups = [aws_security_group.monitoring.id]
  }

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ssh_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "skyops-sg" }
}

# ── EC2 instance ──────────────────────────────────────────────────
resource "aws_instance" "skyops" {
  ami                    = data.aws_ami.al2023.id
  instance_type          = var.instance_type
  key_name               = var.key_name
  iam_instance_profile   = aws_iam_instance_profile.skyops_ec2.name
  vpc_security_group_ids = [aws_security_group.skyops.id]

  root_block_device {
    volume_type = "gp3"
    volume_size = 20
    encrypted   = true
  }

  user_data = templatefile("${path.module}/user_data.sh.tpl", {
    aws_region         = var.aws_region
    ssm_prefix         = var.ssm_prefix
    dockerhub_username = var.dockerhub_username
    image_tag          = var.app_image_tag
  })

  tags = { Name = "skyops-app" }

  depends_on = [aws_internet_gateway.skyops]

  lifecycle {
    ignore_changes = [ami, user_data]
  }
}

# ── Elastic IP ────────────────────────────────────────────────────
resource "aws_eip" "skyops" {
  domain = "vpc"
  tags   = { Name = "skyops-eip" }
}

resource "aws_eip_association" "skyops" {
  instance_id   = aws_instance.skyops.id
  allocation_id = aws_eip.skyops.id
}
