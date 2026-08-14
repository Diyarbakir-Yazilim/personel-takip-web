import { Injectable, NestInterceptor, ExecutionContext, CallHandler, ForbiddenException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import * as crypto from 'crypto';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    const req = ctx.switchToHttp().getRequest();
    const body = req.body || {};

    // Block biometric data processing strictly as per requirements
    const biometricKeywords = ['fingerprint', 'faceData', 'iris', 'retina', 'biometric'];
    for (const key of Object.keys(body)) {
        if (biometricKeywords.includes(key)) {
            throw new ForbiddenException('Processing of biometric data is strictly prohibited.');
        }
    }

    if (['GET', 'OPTIONS'].includes(req.method)) return next.handle();

    return next.handle().pipe(
      tap(async (result) => {
        const ipHash = this.hashIp(req.ip);
        
        console.log('AUDIT LOG:', {
          actorId: req.user?.sub ?? null,
          actorRole: req.user?.role ?? 'ANONYMOUS',
          action: `${req.method} ${req.route.path}`,
          entityId: result?.id ?? null,
          ipAddress: ipHash, // KVKK: salted hash instead of raw IP
          userAgent: req.headers['user-agent']?.slice(0, 255),
          occurredAt: new Date(),
        });
      }),
    );
  }

  private hashIp(ip: string): string {
    if (!ip) return null;
    const salt = process.env.AUDIT_SALT || 'default_salt';
    return crypto.createHmac('sha256', salt).update(ip).digest('hex').slice(0, 16);
  }
}
