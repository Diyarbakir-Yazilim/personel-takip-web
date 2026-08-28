import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ScansService } from './scans.service';
import { CreateBatchScanDto } from './dto/create-batch-scan.dto'; 
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Scan Operations')
@ApiBearerAuth()
@Controller('scans')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ScansController {
  constructor(private readonly scansService: ScansService) {}

  @Post('batch')
  @HttpCode(HttpStatus.CREATED)
  @Roles('ADMIN', 'STAFF', 'SUPERVISOR') // Restrict batch sync to authorized cleaning staff and admins
  @ApiOperation({
    summary: 'Synchronizes offline batch scan events from mobile devices',
  })
  @ApiResponse({
    status: 201,
    description: 'Batch scans successfully processed and synchronized.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid batch payload or validation error.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized access.' })
  async processBatch(@Body() dto: CreateBatchScanDto) {
    return await this.scansService.processBatchScans(dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN', 'SUPERVISOR')
  @ApiOperation({
    summary: 'Retrieves paginated scan history (Admin & Supervisor only)',
  })
  @ApiQuery({
    name: 'skip',
    required: false,
    type: Number,
    description: 'Number of records to skip for pagination',
  })
  @ApiQuery({
    name: 'take',
    required: false,
    type: Number,
    description: 'Number of records to take per page (default: 50)',
  })
  @ApiResponse({
    status: 200,
    description: 'Scan list retrieved successfully.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized access.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden resource (Insufficient permissions).',
  })
  async getScans(
    @Query('skip', new ParseIntPipe({ optional: true })) skip = 0,
    @Query('take', new ParseIntPipe({ optional: true })) take = 50,
  ) {
    return await this.scansService.findAll(skip, take);
  }
}
