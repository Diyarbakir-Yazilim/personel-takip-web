import { Module } from '@nestjs/common';
import { ScansController } from './scans.controller';
import { ScansService } from './scans.service';

@Module({
  controllers: [ScansController],
  providers: [ScansService],
})
export class ScansModule {}
