import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ExportProcessor } from './modules/reporting/export.processor';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { TasksModule } from './tasks/tasks.module';
import { RedisModule } from './common/redis/redis.module';
import { ScansModule } from './scans/scans.module';
import { BullModule } from '@nestjs/bullmq';
import { QrModule } from './qr/qr.module';

@Module({
  imports: [
    AuthModule, 
    PrismaModule, 
    RedisModule, 
    ScansModule,
    QrModule,
    TasksModule,
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
