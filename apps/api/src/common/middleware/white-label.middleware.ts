import { Injectable, NestMiddleware, NotFoundException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { prisma } from '@brandflow/db';

@Injectable()
export class WhiteLabelMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const host = req.headers.host;
    const protocol = req.headers['x-forwarded-proto'] || 'http';

    if (!host) {
      return next();
    }

    // Skip for main app domains
    const mainAppDomains = ['localhost:3000', 'localhost:3001', 'localhost:3002', 'brandflow.ai'];
    if (mainAppDomains.some(d => host.includes(d))) {
      return next();
    }

    // Try to find business by custom domain in whiteLabel JSON
    // Note: In production, use a dedicated custom_domain column for indexing
    const business = await prisma.business.findFirst({
      where: {
        whiteLabel: {
          path: ['domain'],
          equals: host,
        },
      },
    });

    if (business) {
      // Attach business context to request for later use in controllers/interceptors
      (req as any).whiteLabelBusinessId = business.id;
      (req as any).whiteLabelConfig = business.whiteLabel;
    }

    next();
  }
}
