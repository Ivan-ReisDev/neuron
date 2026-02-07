import { Injectable } from '@nestjs/common';
import { JwtPayload } from '../auth/types/jwt-payload';
import { SIDEBAR_ITEMS } from './constants/sidebar-items';
import { SidebarResponseItem } from './types/sidebar-item';
import { PageAccessResponse } from './types/page-access-response';

@Injectable()
export class MenuService {
  getSidebar(currentUser: JwtPayload): SidebarResponseItem[] {
    return SIDEBAR_ITEMS.filter((item) =>
      this.hasPermission(currentUser, item.requiredPermission),
    ).map(({ label, slug, icon }) => ({ label, slug, icon }));
  }

  checkPageAccess(currentUser: JwtPayload, slug: string): PageAccessResponse {
    const item = SIDEBAR_ITEMS.find((i) => i.slug === slug);

    if (!item) {
      return { hasAccess: false };
    }

    return {
      hasAccess: this.hasPermission(currentUser, item.requiredPermission),
    };
  }

  private hasPermission(
    currentUser: JwtPayload,
    requiredPermission: string | null,
  ): boolean {
    if (!requiredPermission) {
      return true;
    }

    return currentUser.permissions.includes(requiredPermission);
  }
}
