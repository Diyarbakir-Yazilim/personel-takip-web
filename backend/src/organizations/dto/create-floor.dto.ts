import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFloorDto {
  @ApiPropertyOptional({
    description: 'Katın bağlı olduğu binanın UUID kimliği',
    example: 'd3b07384-d113-44a6-a710-d62963e3b3a7',
  })
  @IsUUID()
  @IsOptional()
  buildingId?: string;

  @ApiProperty({
    description: 'Kat adı veya tanımı',
    example: '1. Kat',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({
    description: 'Katın sayısal seviye sırası (Örn: Zemin=0, Bodrum=-1)',
    example: 1,
  })
  @IsInt()
  @IsOptional()
  level?: number;
}
