import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, { provide: APP_INTERCEPTOR, useClass: AuditInterceptor }],
})
export class AppModule {}
