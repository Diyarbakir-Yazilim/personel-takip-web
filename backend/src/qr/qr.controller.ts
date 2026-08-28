import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { GenerateQrDto } from './dto/generate-qr.dto';
import { ValidateScanDto } from './dto/validate-scan.dto';
import { QrService } from './qr.service';

@ApiTags('QR Operations')
@ApiBearerAuth()
// @UseGuards(JwtAuthGuard, RolesGuard)
@Controller('qr')
export class QrController {
  constructor(private readonly qrService: QrService) {}

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  // @Roles(Role.ADMIN) // Restricted to Admin users only
  @ApiOperation({
    summary: 'Generates HMAC-signed QR payload for a given location',
  })
  @ApiQuery({
    name: 'isDynamic',
    required: false,
    type: Boolean,
    description: 'Set to true for dynamic time-sensitive QR',
  })
  @ApiResponse({
    status: 200,
    description: 'QR payload generated successfully.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized access.' })
  @ApiResponse({ status: 403, description: 'Forbidden resource (Admin only).' })
  generateQr(
    @Body() dto: GenerateQrDto,
    @Query('isDynamic') isDynamic?: boolean,
  ) {
    return this.qrService.generatePayload(dto, isDynamic);
  }

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  // @Roles(Role.ADMIN, Role.CLEANER, Role.STAFF) // Accessible by staff and admin
  @ApiOperation({
    summary: 'Validates scanned QR code signature and expiration',
  })
  @ApiResponse({ status: 200, description: 'QR scan validated successfully.' })
  @ApiResponse({
    status: 400,
    description: 'Invalid signature, expired timestamp, or malformed payload.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized access.' })
  validateScan(@Body() dto: ValidateScanDto) {
    return this.qrService.validateScan(dto);
  }
}
