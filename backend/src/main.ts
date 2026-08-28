import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, OpenAPIObject } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import * as fs from 'fs';
import * as path from 'path';
import * as YAML from 'yaml';

import { AppModule } from './app.module';
import { RedisIoAdapter } from './events/redis-io.adapter';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // CookieParser middleware'ini ekliyoruz (req.cookies okuyabilmek için şart)
  app.use(cookieParser());

  // Set global API route prefix
  app.setGlobalPrefix('v1');

  // Configure Redis WebSocket adapter
  const redisIoAdapter = new RedisIoAdapter(app);
  redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);

  // Configure CORS security policies
  // Credentials (cookie) kullanıldığı için origin '*' olamaz, spesifik adres olmalıdır.
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://localhost:3001'];

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Enable global request validation and transformation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Resolve OpenAPI documentation file path
  let yamlFilePath = path.join(process.cwd(), 'openapi.yaml');
  if (!fs.existsSync(yamlFilePath)) {
    yamlFilePath = path.join(process.cwd(), 'src', 'docs', 'openapi.yaml');
  }

  // Setup Swagger API documentation if definition exists
  if (fs.existsSync(yamlFilePath)) {
    const fileContent = fs.readFileSync(yamlFilePath, 'utf8');
    const swaggerDocument = YAML.parse(fileContent) as OpenAPIObject;

    SwaggerModule.setup('docs', app, swaggerDocument, {
      useGlobalPrefix: false,
    });
    logger.log(`Swagger Documentation loaded from: ${yamlFilePath}`);
  } else {
    logger.error(
      `openapi.yaml file not found! Searched location: ${yamlFilePath}`,
    );
  }

  // Start HTTP server
  const port = Number(process.env.PORT) || 5000;
  await app.listen(port);

  logger.log(`🚀 Server is running at http://localhost:${port}/v1`);
  logger.log(`📚 Swagger documentation at http://localhost:${port}/docs`);
}

// Execute bootstrap process with explicit error handling
bootstrap().catch((err: unknown) => {
  const logger = new Logger('BootstrapException');
  logger.error('Failed to start application during bootstrap:', err);
  process.exit(1);
});
