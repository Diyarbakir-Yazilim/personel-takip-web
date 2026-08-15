import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ScansService } from './scans.service';
import { CreateBatchScanDto } from './dto/create-batch-scan.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('scans')
@UseGuards(JwtAuthGuard)
export class ScansController {
  constructor(private readonly scansService: ScansService) {}

  @Post('batch')
  async processBatch(@Body() dto: CreateBatchScanDto) {
    return await this.scansService.processBatchScans(dto);
  }
}