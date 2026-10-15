terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.50"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # Remote state backend can be uncommented once bootstrap state bucket is provisioned:
  # backend "s3" {
  #   bucket         = "finsight-tfstate-982503294595-ap-south-1"
  #   key            = "dev/terraform.tfstate"
  #   region         = "ap-south-1"
  #   dynamodb_table = "finsight-terraform-locks"
  #   encrypt        = true
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "FinSight"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}
