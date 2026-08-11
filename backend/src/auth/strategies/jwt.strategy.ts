import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'secretKey', // .env dosyanızdaki JWT_SECRET
    });
  }

  async validate(payload: { sub: string; email: string; role?: string }) {
    if (!payload) {
      throw new UnauthorizedException('Geçersiz token');
    }
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}