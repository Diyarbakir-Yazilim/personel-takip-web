import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RetentionService } from './modules/retention/retention.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { TasksModule } from './tasks/tasks.module';
import { RedisModule } from './common/redis/redis.module';
import { ScansModule } from './scans/scans.module';
import { ScheduleModule } from '@nestjs/schedule';
import { QrModule } from './qr/qr.module';

@Module({
  imports: [AuthModule, PrismaModule, RedisModule, ScansModule, QrModule, TasksModule, ScheduleModule.forRoot()],
  controllers: [AppController],
  providers: [AppService, RetentionService],
})
export class AppModule {}
