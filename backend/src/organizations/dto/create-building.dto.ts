import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBuildingDto {
  @ApiProperty({
    description: 'Binanın adı',
    example: 'A Blok Ana Hizmet Binası',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;
}
