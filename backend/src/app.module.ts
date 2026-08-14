import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RetentionService } from './modules/retention/retention.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, RetentionService],
})
export class AppModule {}
