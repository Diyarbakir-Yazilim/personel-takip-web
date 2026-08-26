import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { hash, verify } from '@node-rs/argon2';
import { PrismaService } from '../prisma/prisma.service'; 
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  
  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('This email address is already in use.');
    }

 
    const hashedPassword = await hash(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        fullName: dto.fullName,
        role: dto.role,
      },
    });

    return this.generateToken(user.id, user.email, user.role);
  }

 
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

 
    const isPasswordValid = await verify(user.password, dto.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (user.role !== 'ADMIN') {
      if (!user.deviceId) {
        
        await this.prisma.user.update({
          where: { id: user.id },
          data: { deviceId: dto.deviceId },
        });
      } else if (user.deviceId !== dto.deviceId) {
        
        throw new UnauthorizedException(
          'This account is registered to another device. You can only log in from your bound device.',
        );
      }
    }
    return this.generateToken(user.id, user.email, user.role);
  }


  private async generateToken(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      access_token: accessToken,
      user: {
        id: userId,
        email,
        role,
      },
    };
  }
}