import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';
import * as YAML from 'yaml';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('v1');

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  let yamlFilePath = path.join(process.cwd(), 'openapi.yaml');
  if (!fs.existsSync(yamlFilePath)) {
    yamlFilePath = path.join(process.cwd(), 'src', 'docs', 'openapi.yaml');
  }

  if (fs.existsSync(yamlFilePath)) {
    const fileContent = fs.readFileSync(yamlFilePath, 'utf8');
    const swaggerDocument = YAML.parse(fileContent);

    SwaggerModule.setup('docs', app, swaggerDocument, {
      useGlobalPrefix: false, 
    });
    console.log(`📚 Swagger Documentation Uploaded: ${yamlFilePath}`);
  } else {
    console.error(`❌ openapi.yaml file not found! Searched location: ${yamlFilePath}`);
  }

  const port = process.env.PORT ?? 5000;
  await app.listen(port);
  console.log(`🚀 Server is running at http://localhost:${port}/v1`);
  console.log(`📚 Swagger: http://localhost:${port}/docs`);
}

bootstrap();