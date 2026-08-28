import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QrController } from './qr.controller';
import { QrService } from './qr.service';

@Module({
  imports: [ConfigModule],
  controllers: [QrController],
  providers: [QrService],
  exports: [QrService],
})
export class QrModule {}
