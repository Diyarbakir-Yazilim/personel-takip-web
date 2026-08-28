import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateZoneDto {
  @ApiPropertyOptional({
    description: 'Bölgenin bağlı olduğu katın UUID kimliği',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsUUID()
  @IsOptional()
  floorId?: string;

  @ApiProperty({
    description: 'Bölgeye ait benzersiz kod (Zone Code)',
    example: 'K1-LAV-01',
  })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({
    description: 'Bölgenin adı',
    example: '1. Kat Bay Lavabo',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({
    description: 'Minimum geçerli temizlik süresi (saniye)',
    example: 180,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  minDurationSec?: number;

  @ApiPropertyOptional({
    description: 'Maksimum beklenen temizlik süresi (saniye)',
    example: 1200,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  maxDurationSec?: number;
}
