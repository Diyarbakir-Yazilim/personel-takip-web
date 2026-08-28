import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { hash, verify } from '@node-rs/argon2';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokens> {
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

    return await this.generateTokens(user.id, user.email, user.role);
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
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

    return await this.generateTokens(user.id, user.email, user.role);
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const refreshSecret =
        process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_key_123';

      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        email: string;
        role: string;
        type: string;
      }>(refreshToken, {
        secret: refreshSecret,
      });

      // Token tipi refresh değilse reddet
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type.');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User not found.');
      }

      return await this.generateTokens(user.id, user.email, user.role);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: string,
  ): Promise<AuthTokens> {
    const accessPayload = { sub: userId, email, role, type: 'access' };
    const refreshPayload = { sub: userId, email, role, type: 'refresh' };

    const accessSecret =
      process.env.JWT_SECRET || 'fallback_access_secret_key_123';
    const refreshSecret =
      process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_key_123';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: accessSecret,
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: refreshSecret,
        expiresIn: '3d',
      }),
    ]);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: userId,
        email,
        role,
      },
    };
  }
}