import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  IsPositive,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ValidateScanDto {
  @ApiProperty({
    description: 'UUID identifier of the scanned location (Zone/Floor)',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsUUID()
  @IsString()
  @IsNotEmpty()
  locationId!: string;

  @ApiPropertyOptional({
    description:
      'Unix Epoch timestamp for dynamic QR code validation (Optional for static printed QR codes)',
    example: 1772048183,
  })
  @IsOptional()
  @IsPositive()
  @IsNumber()
  timestamp?: number;

  @ApiProperty({
    description: 'HMAC-SHA256 signature generated for QR validation',
    example: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  })
  @IsString()
  @IsNotEmpty()
  signature!: string;
}
