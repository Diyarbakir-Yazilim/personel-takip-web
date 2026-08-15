import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ExportProcessor } from './modules/reporting/export.processor';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { ScansModule } from './scans/scans.module';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    AuthModule, 
    PrismaModule, 
    RedisModule, 
    ScansModule,
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
      },
    }),
    BullModule.registerQueue({
      name: 'export-queue',
    }),
  ],
  controllers: [AppController],
  providers: [AppService, ExportProcessor],
})
export class AppModule {}
