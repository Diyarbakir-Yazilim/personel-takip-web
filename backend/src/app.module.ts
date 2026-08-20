import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventsModule } from './events/events.module';
import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ExportProcessor } from './reporting/export.processor';
import { RetentionService } from './retention/retention.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { TasksModule } from './tasks/tasks.module';
import { RedisModule } from './common/redis/redis.module';
import { ScansModule } from './scans/scans.module';
import { ScheduleModule } from '@nestjs/schedule';
import { QrModule } from './qr/qr.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    EventsModule,
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
      },
    }),
    BullModule.registerQueue({
      name: 'export-queue',
    }),
    AuthModule,
    PrismaModule,
    RedisModule,
    ScansModule,
    QrModule,
    TasksModule,
    ScheduleModule.forRoot(),
    OrganizationsModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService, RetentionService, ExportProcessor],
})
export class AppModule {}
