import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest();
    const response = httpContext.getResponse();

    const { method, url, ip, headers, body, user } = request;

    // Sadece durumu değiştiren (state-mutating) metodları logla
    const mutatingMethods = ['POST', 'PATCH', 'DELETE'];

    return next.handle().pipe(
      tap({
        next: async () => {
          if (mutatingMethods.includes(method)) {
            try {
              await this.prisma.auditLog.create({
                data: {
                  userId: user?.id || null,
                  method,
                  path: url,
                  statusCode: response.statusCode,
                  ip: ip || request.socket.remoteAddress,
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
}