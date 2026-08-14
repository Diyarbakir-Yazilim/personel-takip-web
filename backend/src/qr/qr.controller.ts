import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { GenerateQrDto } from './dto/generate-qr.dto';
import { ValidateScanDto } from './dto/validate-scan.dto';
import { QrService } from './qr.service';

@Controller('qr')
export class QrController {
  constructor(private readonly qrService: QrService) {}

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  generateQr(@Body() dto: GenerateQrDto) {
    return this.qrService.generatePayload(dto);
  }

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  validateScan(@Body() dto: ValidateScanDto) {
    return this.qrService.validateScan(dto);
  }
}