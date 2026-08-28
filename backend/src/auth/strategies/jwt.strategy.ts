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
          let token = null;
          if (request && request.cookies) {
            token = request.cookies['access_token'];
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

  validate(payload: { sub: string; email: string; role?: string }) {
    if (!payload) {
      throw new UnauthorizedException('Geçersiz token');
    }
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
