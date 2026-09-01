import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // 1. Önce çerezden (cookie) 'access_token' değerini okumayı dene
        (request: Request) => {
          let token: string | null = null;
          if (request && request.cookies) {
            token =
              (request.cookies as Record<string, string>)['access_token'] ||
              null;
          }
          return token;
        },
        // 2. Çerezde yoksa varsayılan Authorization: Bearer başlığına bak
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'secretKey',
    });
  }

  validate(payload: {
    sub: string;
    email: string;
    role?: string;
    fullName?: string;
  }) {
    if (!payload) {
      throw new UnauthorizedException('Geçersiz token');
    }
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      fullName: payload.fullName,
    };
  }
}
