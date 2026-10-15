variable "environment" {
  description = "Environment name (dev, prod)"
  type        = string
}

variable "kms_key_arn" {
  description = "KMS Key ARN for encrypting SecureString parameters"
  type        = string
}

variable "initial_mongo_uri" {
  description = "Initial placeholder MongoDB URI (can be updated out-of-band via AWS CLI or Console)"
  type        = string
  default     = "mongodb+srv://placeholder:placeholder@cluster0.mongodb.net/finsight?retryWrites=true&w=majority"
}

variable "initial_jwt_secret" {
  description = "Initial placeholder JWT secret"
  type        = string
  default     = "finsight-dev-jwt-placeholder-secret-at-least-32-chars-long"
}

variable "client_url" {
  description = "Allowed frontend client URL"
  type        = string
  default     = ""
}
