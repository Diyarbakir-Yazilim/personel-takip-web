import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ExportProcessor } from './modules/reporting/export.processor';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, ExportProcessor],
})
export class AppModule {}
