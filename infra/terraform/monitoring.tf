# ── Monitoring EC2 Security Group ────────────────────────────────
resource "aws_security_group" "monitoring" {
  name        = "skyops-monitoring-sg"
  description = "SkyOps monitoring: Grafana from allowed CIDR; Loki from VPC"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "Grafana"
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ssh_cidr]
  }

  ingress {
    description = "Prometheus"
    from_port   = 9090
    to_port     = 9090
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ssh_cidr]
  }

  ingress {
    description = "Alertmanager"
    from_port   = 9093
    to_port     = 9093
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ssh_cidr]
  }

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ssh_cidr]
  }

  ingress {
    description = "Loki push from VPC - Promtail on app EC2"
    from_port   = 3100
    to_port     = 3100
    protocol    = "tcp"
    cidr_blocks = [data.aws_vpc.default.cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "skyops-monitoring-sg" }

  lifecycle {
    prevent_destroy = true
    ignore_changes  = [ingress, egress]
  }
}

# ── Monitoring EC2 Instance ───────────────────────────────────────
resource "aws_instance" "monitoring" {
  ami                    = data.aws_ami.al2023.id
  instance_type          = "m5.xlarge"
  key_name               = var.key_name
  vpc_security_group_ids = [aws_security_group.monitoring.id]

  root_block_device {
    volume_type = "gp3"
    volume_size = 30
    encrypted   = true
  }

  tags = { Name = "skyops-monitoring" }

  lifecycle {
    prevent_destroy = true
    ignore_changes  = [ami, user_data]
  }
}

# ── Monitoring Elastic IP (pre-existing, managed outside Terraform)
data "aws_eip" "monitoring" {
  public_ip = var.monitor_eip
}

resource "aws_eip_association" "monitoring" {
  instance_id   = aws_instance.monitoring.id
  allocation_id = data.aws_eip.monitoring.id

  lifecycle {
    ignore_changes = [instance_id, allocation_id]
  }
}
