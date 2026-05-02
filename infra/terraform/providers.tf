terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    # Values injected via -backend-config in infra.yml (kept out of source)
    # bucket         = var TF_BACKEND_BUCKET
    # key            = "ec2/terraform.tfstate"
    # region         = var TF_BACKEND_REGION
    # dynamodb_table = var TF_BACKEND_DYNAMO_TABLE
    # encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
}
