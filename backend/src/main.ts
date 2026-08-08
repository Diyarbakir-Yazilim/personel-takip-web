import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';
import * as YAML from 'yaml';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Global Prefix
  app.setGlobalPrefix('v1');

  // 2. CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // 3. Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 4. OpenAPI (Swagger) Entegrasyonu
  // Hem root dizini hem de src dizinini kontrol edelim
  let yamlFilePath = path.join(process.cwd(), 'openapi.yaml');
  if (!fs.existsSync(yamlFilePath)) {
    yamlFilePath = path.join(process.cwd(), 'src','docs' , 'openapi.yaml');
  }

  if (fs.existsSync(yamlFilePath)) {
    const fileContent = fs.readFileSync(yamlFilePath, 'utf8');
    const swaggerDocument = YAML.parse(fileContent);
    
    // Global prefix aktif olduğu için Swagger'ı v1/docs altına veya direkt /docs'a bağlamak için:
    SwaggerModule.setup('docs', app, swaggerDocument, {
      useGlobalPrefix: false, // /docs adresinden doğrudan erişim sağlar
    });
    console.log(`📚 Swagger Dokümantasyonu Yüklendi: ${yamlFilePath}`);
  } else {
    console.error(`❌ openapi.yaml dosyası bulunamadı! Aranan konum: ${yamlFilePath}`);
  }

  const port = process.env.PORT ?? 5000;
  await app.listen(port);
  console.log(`🚀 Sunucu http://localhost:${port}/v1 üzerinde çalışıyor`);
  console.log(`📚 Swagger: http://localhost:${port}/docs`);
}

bootstrap();