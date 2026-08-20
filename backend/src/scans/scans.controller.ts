import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ScansService } from './scans.service';
import { CreateBatchScanDto } from './dto/create-batch-scan.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('scans')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ScansController {
  constructor(private readonly scansService: ScansService) {}

  @Post('batch')
  async processBatch(@Body() dto: CreateBatchScanDto) {
    return await this.scansService.processBatchScans(dto);
  }

  @Get()
  @Roles('ADMIN', 'SUPERVISOR')
  async getScans(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return await this.scansService.findAll(
      skip ? parseInt(skip, 10) : 0,
      take ? parseInt(take, 10) : 50,
    );
  }
}