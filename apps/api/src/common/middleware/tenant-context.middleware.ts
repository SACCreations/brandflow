import {
  Injectable,
  NestMiddleware,
  ForbiddenException,
} from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { prisma } from '@brandflow/db';
import type { JwtPayload } from '@brandflow/shared';

interface RequestWithUser extends Request {
  user?: JwtPayload;
}

/**
 * Validates that the authenticated user is a member of the business
 * they're acting on, and sets the RLS tenant context.
 */
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  async use(req: RequestWithUser, _res: Response, next: NextFunction): Promise<void> {
    const user = req.user;
    if (!user?.businessId) {
      return next();
    }

    // Verify user belongs to the claimed business
    const membership = await prisma.membership.findUnique({
      where: {
        userId_businessId: {
          userId: user.sub,
          businessId: user.businessId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('Access denied to this workspace');
    }

    next();
  }
}
