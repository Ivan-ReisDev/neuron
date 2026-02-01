import { SetMetadata } from '@nestjs/common';
import { Resource } from '../../modules/permission/enums/resource.enum';
import { Action } from '../../modules/permission/enums/action.enum';

export const REQUIRED_PERMISSION_KEY = 'requiredPermission';

export interface RequiredPermission {
  resource: Resource;
  action: Action;
}

export const RequirePermissions = (resource: Resource, action: Action) =>
  SetMetadata(REQUIRED_PERMISSION_KEY, { resource, action });
