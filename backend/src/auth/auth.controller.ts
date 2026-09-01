import {
  Body,
  Controller,
  Get,
  Patch,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
  Res,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request as ExpressRequest, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

interface RequestWithCookies extends ExpressRequest {
  cookies: Record<string, string | undefined>;
}

interface AuthenticatedRequest extends ExpressRequest {
  user: {
    id: string;
    fullName?: string;
    email: string;
    role: string;
  };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken?: string,
  ) {
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60 * 1000,
    });

    if (refreshToken) {
      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 3 * 24 * 60 * 60 * 1000,
      });
    }
  }

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(dto);
    this.setAuthCookies(res, result.access_token, result.refresh_token);
    return { user: result.user };
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);
    this.setAuthCookies(res, result.access_token, result.refresh_token);
    return { user: result.user };
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(
    @Req() req: RequestWithCookies,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cookies = req.cookies || {};
    const refreshToken = cookies['refresh_token'];

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found.');
    }

    const result = await this.authService.refreshToken(refreshToken);
    this.setAuthCookies(res, result.access_token, result.refresh_token);

    return { success: true };
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
    });
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
    });
    res.clearCookie('role', {
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      path: '/',
    });

    return { message: 'Successfully logged out.' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: AuthenticatedRequest) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(
    @Request() req: AuthenticatedRequest,
    @Body() dto: { fullName?: string; email?: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = req.user.id;
    const result = await this.authService.updateProfile(userId, dto);

    if (result.access_token) {
      this.setAuthCookies(res, result.access_token, result.refresh_token);
    }

    return { user: result.user };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  async changePassword(
    @Request() req: AuthenticatedRequest,
    @Body() dto: { currentPassword: string; newPassword: string },
  ) {
    const userId = req.user.id;
    await this.authService.changePassword(
      userId,
      dto.currentPassword,
      dto.newPassword,
    );

    return { message: 'Şifreniz başarıyla güncellendi.' };
  }
}