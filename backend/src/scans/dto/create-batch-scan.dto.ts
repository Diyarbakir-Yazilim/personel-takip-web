import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ScanAction, ScanMethod } from '@prisma/client';

export class ScanLocationDto {
  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;

  @IsOptional()
  @IsNumber()
  accuracy?: number;
}

export class DeviceIntegrityDto {
  @IsOptional()
  isRooted?: boolean;

  @IsOptional()
  isEmulator?: boolean;

  @IsOptional()
  isMockLocation?: boolean;
}

export class SingleScanDto {
  @IsUUID()
  idempotencyKey: string;

  @IsUUID()
  clientEventId: string;

  @IsUUID()
  userId: string;

  @IsOptional()
  @IsUUID()
  taskId?: string;

  @IsString()
  @IsNotEmpty()
  token: string;

  @IsEnum(ScanAction)
  @IsOptional()
  requestedAction?: ScanAction;

  @IsEnum(ScanAction)
  resolvedAction: ScanAction;

  @IsEnum(ScanMethod)
  method: ScanMethod;

  @IsString()
  @IsNotEmpty()
  clientScannedAt: string;

  @IsOptional()
  @IsInt()
  riskScore?: number;

  @IsOptional()
  @IsArray()
  riskFlags?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => ScanLocationDto)
  location?: ScanLocationDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DeviceIntegrityDto)
  deviceIntegrity?: DeviceIntegrityDto;
}

export class CreateBatchScanDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SingleScanDto)
  scans: SingleScanDto[];
}
