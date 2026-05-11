import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import type { Permission } from '@brandflow/shared';
import type { JwtPayload } from '@brandflow/shared';
import type { RequestWithUser } from '../decorators/current-user.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user: JwtPayload = request.user;

    if (!user) {
      throw new ForbiddenException('No user context');
    }

    // Permission check will be done against the role's permissions loaded from DB
    // For now, we store permissions on the JWT in a future iteration
    // This guard cooperates with the TenantGuard which sets business context
    return true;
  }
}
