resource "aws_secretsmanager_secret" "anthropic_api_key" {
  name                    = "${local.name_prefix}/anthropic-api-key"
  recovery_window_in_days = 7

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "anthropic_api_key" {
  secret_id     = aws_secretsmanager_secret.anthropic_api_key.id
  secret_string = var.anthropic_api_key
}

resource "random_password" "origin_verify" {
  length  = 32
  special = false
}
