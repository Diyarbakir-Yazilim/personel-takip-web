import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { ScansModule } from './scans/scans.module';

@Module({
  imports: [AuthModule, PrismaModule, RedisModule, ScansModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
