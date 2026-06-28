resource "aws_ecs_cluster" "main" {
  name = "${local.name_prefix}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = local.common_tags
}

locals {
  api_image = "${aws_ecr_repository.api.repository_url}:${var.ecr_image_tag}"

  cors_origins = compact(concat(
    var.allowed_origins != "" ? [for o in split(",", var.allowed_origins) : trimspace(o)] : [],
    ["https://${aws_cloudfront_distribution.main.domain_name}"],
    var.domain_name != "" ? ["https://${var.domain_name}"] : []
  ))

  job_environment = [
    { name = "JOB_STORE_BACKEND", value = "dynamodb" },
    { name = "JOB_QUEUE_BACKEND", value = "sqs" },
    { name = "JOB_TABLE_NAME", value = aws_dynamodb_table.jobs.name },
    { name = "JOB_QUEUE_URL", value = aws_sqs_queue.pipeline.url },
    { name = "AWS_REGION", value = var.aws_region },
    { name = "ENABLE_SYNC_PIPELINE", value = "false" },
  ]
}

resource "aws_ecs_task_definition" "api" {
  family                   = "${local.name_prefix}-api"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.api_cpu
  memory                   = var.api_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name      = "api"
    image     = local.api_image
    essential = true

    portMappings = [{
      containerPort = var.api_container_port
      hostPort      = var.api_container_port
      protocol      = "tcp"
    }]

    environment = concat(
      [
        {
          name  = "ALLOWED_ORIGINS"
          value = join(",", local.cors_origins)
        }
      ],
      local.job_environment
    )

    secrets = [{
      name      = "ANTHROPIC_API_KEY"
      valueFrom = aws_secretsmanager_secret.anthropic_api_key.arn
    }]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = aws_cloudwatch_log_group.api.name
        awslogs-region        = var.aws_region
        awslogs-stream-prefix = "api"
      }
    }

    healthCheck = {
      command     = ["CMD-SHELL", "python -c \"import urllib.request; urllib.request.urlopen('http://127.0.0.1:${var.api_container_port}/health')\""]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 60
    }
  }])

  tags = local.common_tags
}

resource "aws_ecs_task_definition" "worker" {
  family                   = "${local.name_prefix}-worker"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.worker_cpu
  memory                   = var.worker_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name      = "worker"
    image     = local.api_image
    essential = true
    command   = ["python", "-m", "priorauth.worker"]

    environment = local.job_environment

    secrets = [{
      name      = "ANTHROPIC_API_KEY"
      valueFrom = aws_secretsmanager_secret.anthropic_api_key.arn
    }]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = aws_cloudwatch_log_group.worker.name
        awslogs-region        = var.aws_region
        awslogs-stream-prefix = "worker"
      }
    }
  }])

  tags = local.common_tags
}

resource "aws_ecs_service" "worker" {
  name            = "${local.name_prefix}-worker"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.worker.arn
  desired_count   = var.worker_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.enable_nat_gateway ? module.vpc.private_subnets : module.vpc.public_subnets
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = !var.enable_nat_gateway
  }

  tags = local.common_tags
}

resource "aws_ecs_service" "api" {
  name            = "${local.name_prefix}-api"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = var.api_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.enable_nat_gateway ? module.vpc.private_subnets : module.vpc.public_subnets
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = !var.enable_nat_gateway
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "api"
    container_port   = var.api_container_port
  }

  deployment_minimum_healthy_percent = 50
  deployment_maximum_percent         = 200

  depends_on = [aws_lb_listener.http]

  lifecycle {
    ignore_changes = [desired_count]
  }

  tags = local.common_tags
}
