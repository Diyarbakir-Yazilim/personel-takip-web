import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ForbiddenException
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest();
    const response = httpContext.getResponse();

    const { method, url, ip, headers, body, user } = request;

    // Block biometric data processing strictly as per requirements
    const biometricKeywords = ['fingerprint', 'faceData', 'iris', 'retina', 'biometric'];
    const reqBody = body || {};
    for (const key of Object.keys(reqBody)) {
        if (biometricKeywords.includes(key)) {
            throw new ForbiddenException('Processing of biometric data is strictly prohibited.');
        }
    }

    // Sadece durumu değiştiren (state-mutating) metodları logla
    const mutatingMethods = ['POST', 'PATCH', 'DELETE'];

    return next.handle().pipe(
      tap({
        next: async () => {
          if (mutatingMethods.includes(method)) {
            try {
              const ipHash = this.hashIp(ip || request.socket.remoteAddress);
              await this.prisma.auditLog.create({
                data: {
                  userId: user?.id || null,
                  method,
                  path: url,
                  statusCode: response.statusCode,
                  ip: ipHash,
                  userAgent: headers['user-agent'] || null,
                  requestBody: body && Object.keys(body).length > 0 ? JSON.stringify(body) : null,
                },
              });
            } catch (error) {
              console.error('Audit log kaydedilemedi:', error);
            }
          }
        },
      }),
    );
  }

  private hashIp(ip: string): string {
    if (!ip) return null;
    const salt = process.env.AUDIT_SALT || 'default_salt';
    return crypto.createHmac('sha256', salt).update(ip).digest('hex').slice(0, 16);
  }
}
