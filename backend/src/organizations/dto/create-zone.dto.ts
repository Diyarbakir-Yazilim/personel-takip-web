import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateZoneDto {
  @IsUUID()
  @IsOptional()
  floorId?: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  minDurationSec?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  maxDurationSec?: number;
}
