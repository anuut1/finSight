# ==============================================================================
# WAF Module - Regional WAFv2 Web ACL for ALB Protection
# ==============================================================================

resource "aws_wafv2_web_acl" "main" {
  name        = "finsight-waf-${var.environment}"
  description = "Regional WAF protection for FinSight ALB (${var.environment})"
  scope       = "REGIONAL"

  default_action {
    allow {}
  }

  # Rule 1: IP Rate Limiting (Prevents DoS and brute-force attacks)
  rule {
    name     = "RateLimitPerIP"
    priority = 10

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = var.rate_limit_per_ip
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "finsight-waf-ratelimit-${var.environment}"
      sampled_requests_enabled   = true
    }
  }

  # Rule 2: AWS Managed Rules - Common Rule Set (OWASP Top 10, SQLi, XSS, etc.)
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 20

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "finsight-waf-common-rules-${var.environment}"
      sampled_requests_enabled   = true
    }
  }

  # Rule 3: AWS Managed Rules - Known Bad Inputs
  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 30

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "finsight-waf-bad-inputs-${var.environment}"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "finsight-waf-webacl-${var.environment}"
    sampled_requests_enabled   = true
  }

  tags = {
    Name        = "finsight-waf-${var.environment}"
    Environment = var.environment
  }
}

# Associate WAF Web ACL with the Application Load Balancer
resource "aws_wafv2_web_acl_association" "alb" {
  resource_arn = var.alb_arn
  web_acl_arn  = aws_wafv2_web_acl.main.arn
}
