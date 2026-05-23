import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { TenantContext } from './tenant.context';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.businessId) {
      // If we are on a public route, we might not have a user
      // But if we are here, we expect the tenant context to be required for DB ops
      return next.handle();
    }

    return new Observable((subscriber) => {
      TenantContext.run(user.businessId, () => {
        next.handle().subscribe(subscriber);
      });
    });
  }
}
