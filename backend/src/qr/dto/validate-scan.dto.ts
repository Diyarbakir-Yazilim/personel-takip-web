import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class ValidateScanDto {
  @IsString()
  @IsNotEmpty()
  locationId: string;

  @IsNumber()
  @IsNotEmpty()
  timestamp: number; // Unix Epoch timestamp (seconds veya milliseconds)

  @IsString()
  @IsNotEmpty()
  signature: string; // HMAC-SHA256 signature
}