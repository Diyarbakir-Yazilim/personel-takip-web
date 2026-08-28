import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';

// Interceptors
import { AuditInterceptor } from './common/interceptors/audit.interceptor';

// Core Services & Controllers
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ExportProcessor } from './reporting/export.processor';
import { RetentionService } from './retention/retention.service';

// Feature Modules
import { PrismaModule } from './prisma/prisma.module';
import { EventsModule } from './events/events.module';
import { AuthModule } from './auth/auth.module';
import { RedisModule } from './common/redis/redis.module';
import { ScansModule } from './scans/scans.module';
import { QrModule } from './qr/qr.module';
import { TasksModule } from './tasks/tasks.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    // Global Configuration Module
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Core Database & Cache Modules
    PrismaModule,
    RedisModule,

    // Background Jobs & Task Scheduling
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
      },
    }),
    BullModule.registerQueue({
      name: 'export-queue',
    }),

    // Feature Modules
    EventsModule,
    AuthModule,
    ScansModule,
    QrModule,
    TasksModule,
    OrganizationsModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    RetentionService,
    ExportProcessor,
    // Global Interceptor registered via Dependency Injection
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
