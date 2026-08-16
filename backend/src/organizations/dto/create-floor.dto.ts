import { IsString, IsNotEmpty, IsInt, IsOptional, IsUUID } from 'class-validator';

export class CreateFloorDto {
  @IsUUID()
  @IsOptional()
  buildingId?: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @IsOptional()
  level?: number;
}
