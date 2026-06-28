output "ecr_repository_url" {
  description = "Push API Docker images here."
  value       = aws_ecr_repository.api.repository_url
}

output "ecs_cluster_name" {
  description = "ECS cluster running the API."
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "ECS service to force-redeploy after pushing a new image."
  value       = aws_ecs_service.api.name
}

output "alb_dns_name" {
  description = "Direct ALB URL (API only; prefer CloudFront in production)."
  value       = aws_lb.api.dns_name
}

output "cloudfront_domain_name" {
  description = "Public app URL (frontend + /api/* proxied to ALB)."
  value       = aws_cloudfront_distribution.main.domain_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID for cache invalidation."
  value       = aws_cloudfront_distribution.main.id
}

output "cloudfront_url" {
  description = "HTTPS URL for the deployed application."
  value       = "https://${aws_cloudfront_distribution.main.domain_name}"
}

output "frontend_bucket_name" {
  description = "S3 bucket for the Vite build output."
  value       = aws_s3_bucket.frontend.id
}

output "secrets_manager_arn" {
  description = "Secrets Manager ARN for ANTHROPIC_API_KEY."
  value       = aws_secretsmanager_secret.anthropic_api_key.arn
  sensitive   = true
}

output "deploy_api_command" {
  description = "Example command to build, push, and redeploy the API."
  value       = "../../scripts/deploy-api.sh ${var.aws_region} ${aws_ecr_repository.api.repository_url} ${aws_ecs_cluster.main.name} ${aws_ecs_service.api.name}"
}

output "deploy_frontend_command" {
  description = "Example command to build and upload the frontend."
  value       = "../../scripts/deploy-frontend.sh ${aws_s3_bucket.frontend.id} ${aws_cloudfront_distribution.main.id}"
}
