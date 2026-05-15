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
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user: JwtPayload = request.user;

    if (!user || !user.roleId) {
      throw new ForbiddenException('No user context or role assigned');
    }

    // Enterprise RBAC: Fetch role permissions
    // In production, these should be cached in Redis for performance
    const role = await this.prisma.client.role.findUnique({
      where: { id: user.roleId },
      select: { permissions: true },
    });

    if (!role) {
      throw new ForbiddenException('Assigned role not found');
    }

    const rolePermissions = (role.permissions as string[]) || [];

    // Check for superuser or specific permission
    const hasPermission =
      rolePermissions.includes('*') ||
      requiredPermissions.every((p) => rolePermissions.includes(p));

    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions for this operation');
    }

    return true;
  }
}
