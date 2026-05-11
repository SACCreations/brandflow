import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { RequestWithUser } from './current-user.decorator';

export const TenantId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user.businessId;
  },
);
