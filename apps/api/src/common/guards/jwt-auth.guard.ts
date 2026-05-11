import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  override handleRequest<T>(err: Error | null, user: T | false): T {
    if (err || !user) {
      throw new UnauthorizedException('Invalid or expired token');
    }
    return user as T;
  }

  override canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
