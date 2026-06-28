variable "aws_region" {
  description = "AWS region for compute and data services."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Short project name used in resource names."
  type        = string
  default     = "priorauth"
}

variable "environment" {
  description = "Deployment environment (e.g. prod, staging)."
  type        = string
  default     = "prod"
}

variable "vpc_cidr" {
  description = "VPC CIDR block."
  type        = string
  default     = "10.0.0.0/16"
}

variable "enable_nat_gateway" {
  description = "Run ECS tasks in private subnets with NAT egress."
  type        = bool
  default     = true
}

variable "single_nat_gateway" {
  description = "Use one NAT gateway instead of one per AZ (lower cost)."
  type        = bool
  default     = true
}

variable "api_container_port" {
  description = "Port exposed by the FastAPI container."
  type        = number
  default     = 8000
}

variable "api_cpu" {
  description = "Fargate task CPU units."
  type        = number
  default     = 512
}

variable "api_memory" {
  description = "Fargate task memory (MiB)."
  type        = number
  default     = 1024
}

variable "api_desired_count" {
  description = "Number of API tasks to run."
  type        = number
  default     = 2
}

variable "alb_idle_timeout" {
  description = "ALB idle timeout in seconds (LLM pipeline can be slow)."
  type        = number
  default     = 120
}

variable "anthropic_api_key" {
  description = "Anthropic API key stored in Secrets Manager."
  type        = string
  sensitive   = true
}

variable "ecr_image_tag" {
  description = "Docker image tag deployed to ECS."
  type        = string
  default     = "latest"
}

variable "domain_name" {
  description = "Optional custom domain for CloudFront (requires ACM cert in us-east-1)."
  type        = string
  default     = ""
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN in us-east-1 for the custom domain."
  type        = string
  default     = ""
}

variable "allowed_origins" {
  description = "Comma-separated CORS origins for the API (CloudFront URL added automatically)."
  type        = string
  default     = ""
}
