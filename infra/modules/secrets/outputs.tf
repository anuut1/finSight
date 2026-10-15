output "mongo_uri_parameter_arn" {
  description = "ARN of the MongoDB URI SSM parameter"
  value       = aws_ssm_parameter.mongo_uri.arn
}

output "jwt_secret_parameter_arn" {
  description = "ARN of the JWT secret SSM parameter"
  value       = aws_ssm_parameter.jwt_secret.arn
}

output "client_url_parameter_arn" {
  description = "ARN of the client URL SSM parameter"
  value       = aws_ssm_parameter.client_url.arn
}

output "ecs_secrets" {
  description = "Secrets list formatted for ECS task container definitions"
  value = [
    {
      name      = "MONGO_URI"
      valueFrom = aws_ssm_parameter.mongo_uri.arn
    },
    {
      name      = "JWT_SECRET"
      valueFrom = aws_ssm_parameter.jwt_secret.arn
    },
    {
      name      = "CLIENT_URL"
      valueFrom = aws_ssm_parameter.client_url.arn
    }
  ]
}
