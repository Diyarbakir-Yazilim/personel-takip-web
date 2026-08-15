import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { TasksModule } from './tasks/tasks.module';
import { RedisModule } from './common/redis/redis.module';
import { ScansModule } from './scans/scans.module';
import { QrModule } from './qr/qr.module';

@Module({
  imports: [AuthModule, PrismaModule, RedisModule, ScansModule, QrModule, TasksModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
