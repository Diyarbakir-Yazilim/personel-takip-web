import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RetentionService } from './modules/retention/retention.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { ScansModule } from './scans/scans.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [AuthModule, PrismaModule, RedisModule, ScansModule, ScheduleModule.forRoot()],
  controllers: [AppController],
  providers: [AppService, RetentionService],
})
export class AppModule {}
