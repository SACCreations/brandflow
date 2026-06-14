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
import { RedisService } from '../redis/redis.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
    private redis: RedisService,
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

    const cacheKey = `role:permissions:${user.roleId}`;
    let rolePermissions: string[] | null = null;

    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        rolePermissions = JSON.parse(cached);
      }
    } catch (err) {
      console.error('[PermissionsGuard] Redis cache read failed:', err);
    }

    if (!rolePermissions) {
      // Enterprise RBAC: Fetch role permissions
      const role = await this.prisma.client.role.findUnique({
        where: { id: user.roleId },
        select: { permissions: true },
      });

      if (!role) {
        throw new ForbiddenException('Assigned role not found');
      }

      rolePermissions = (role.permissions as string[]) || [];

      try {
        await this.redis.set(cacheKey, JSON.stringify(rolePermissions), 300);
      } catch (err) {
        console.error('[PermissionsGuard] Redis cache write failed:', err);
      }
    }

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

