output "trail_arn" {
  description = "ARN of the CloudTrail trail"
  value       = aws_cloudtrail.main.arn
}

output "bucket_name" {
  description = "Name of the S3 audit bucket"
  value       = aws_s3_bucket.trail.bucket
}

output "bucket_arn" {
  description = "ARN of the S3 audit bucket"
  value       = aws_s3_bucket.trail.arn
}
