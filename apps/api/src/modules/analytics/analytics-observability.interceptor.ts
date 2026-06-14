import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { Request } from 'express';
import * as Sentry from '@sentry/node';

@Injectable()
export class AnalyticsObservabilityInterceptor implements NestInterceptor {
  private readonly logger = new Logger('AnalyticsObservability');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const method = request.method;
    const url = request.url;
    const correlationId = (request.headers['x-correlation-id'] as string) || 'none';
    const user = (request as any).user;
    const tenantId = user?.businessId || 'none';
    const userId = user?.id || 'none';
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          Sentry.withScope((scope) => {
            scope.setTag('tenant_id', tenantId);
            scope.setTag('user_id', userId);
            scope.setTag('request_id', correlationId);
            scope.setTag('route', url);
            scope.setExtra('duration_ms', duration);
            
            if (duration > 500) {
              this.logger.warn(
                `[SLOW QUERY DETECTED] Tenant: ${tenantId} | User: ${userId} | ${method} ${url} took ${duration}ms`
              );
              Sentry.captureMessage(
                `Slow Query Alert: ${method} ${url} took ${duration}ms for tenant ${tenantId}`,
                {
                  level: 'warning',
                  tags: {
                    tenant_id: tenantId,
                    user_id: userId,
                    request_id: correlationId,
                  },
                }
              );
            }
          });
        },
        error: (err: any) => {
          const duration = Date.now() - startTime;
          Sentry.withScope((scope) => {
            scope.setTag('tenant_id', tenantId);
            scope.setTag('user_id', userId);
            scope.setTag('request_id', correlationId);
            scope.setTag('route', url);
            scope.setExtra('duration_ms', duration);
            scope.setLevel('error');
            Sentry.captureException(err);
          });
          this.logger.error(
            `[QUERY ERROR] Tenant: ${tenantId} | ${method} ${url} failed in ${duration}ms: ${err.message || err}`
          );
        },
      })
    );
  }
}
