import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class UpdateUserDto {
  @ApiPropertyOptional({
    example: 'updated.user@example.com',
    description: 'Updated unique email address of the user',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    example: 'NewSecurePassword123!',
    description: 'Updated user password (minimum 6 characters)',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;

  @ApiPropertyOptional({
    example: 'Jane Doe',
    description: 'Updated full name of the user',
  })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({
    enum: UserRole,
    example: UserRole.SUPERVISOR,
    description: 'Updated role assigned to the user',
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiPropertyOptional({
    example: 'https://example.com/new-avatar.jpg',
    description: 'Updated URL of the user profile avatar',
  })
  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @ApiPropertyOptional({
    example: '+905559876543',
    description: 'Updated phone number of the user',
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    example: 'Operations',
    description: 'Updated department name',
  })
  @IsString()
  @IsOptional()
  department?: string;
}
