import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { UserRole } from '@prisma/client';

export class RegisterDto {
  @IsEmail({}, { message: 'Please enter a valid email address.' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long.' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'Full Name is required.' })
  fullName: string;

  @IsEnum(UserRole, { message: 'Please select a valid role.' })
  role?: UserRole = UserRole.STAFF;
}