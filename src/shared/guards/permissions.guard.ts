import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import {
  REQUIRED_PERMISSION_KEY,
  RequiredPermission,
} from '../decorators/require-permissions.decorator';
import { AUTH_MESSAGES } from '../constants/exception-messages';
import { JwtPayload } from '../../modules/auth/types/jwt-payload';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const requiredPermission =
      this.reflector.getAllAndOverride<RequiredPermission>(
        REQUIRED_PERMISSION_KEY,
        [context.getHandler(), context.getClass()],
      );

    if (!requiredPermission) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: JwtPayload }>();
    const user = request.user;

    if (!user || !user.permissions) {
      throw new ForbiddenException(AUTH_MESSAGES.FORBIDDEN);
    }

    const permissionKey = `${requiredPermission.resource}:${requiredPermission.action}`;
    const hasPermission = user.permissions.includes(permissionKey);

    if (!hasPermission) {
      throw new ForbiddenException(AUTH_MESSAGES.FORBIDDEN);
    }

    return true;
  }
}
