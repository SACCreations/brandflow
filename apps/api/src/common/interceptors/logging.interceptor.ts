import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  HttpException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const method = request.method;
    const url = request.url;
    const route = request.route?.path || url;
    const correlationId = (request.headers['x-correlation-id'] as string) || 'none';
    const user = (request as any).user;
    const tenantId = user?.businessId || 'none';
    const userId = user?.id || 'none';
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse<Response>();
          const duration = Date.now() - start;
          const statusCode = response.statusCode;
          this.logger.log(
            `[${correlationId}] ${method} ${route} | User: ${userId} | Tenant: ${tenantId} | Status: ${statusCode} | +${duration}ms`,
          );
        },
        error: (err: unknown) => {
          const duration = Date.now() - start;
          let statusCode = 500;
          if (err instanceof HttpException) {
            statusCode = err.getStatus();
          }
          this.logger.warn(
            `[${correlationId}] ${method} ${route} | User: ${userId} | Tenant: ${tenantId} | Status: ${statusCode} | +${duration}ms | Error: ${err instanceof Error ? err.message : String(err)}`,
          );
        },
      }),
    );
  }
}
