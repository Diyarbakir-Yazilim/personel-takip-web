import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { ScansModule } from './scans/scans.module';

@Module({
  imports: [AuthModule, PrismaModule, RedisModule, ScansModule],
  controllers: [AppController],
  providers: [AppService, { provide: APP_INTERCEPTOR, useClass: AuditInterceptor }],
})
export class AppModule {}
