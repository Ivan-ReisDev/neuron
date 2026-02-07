import { SidebarItem } from '../types/sidebar-item';

export const SIDEBAR_ITEMS: SidebarItem[] = [
  {
    label: 'Dashboard',
    slug: 'dashboard',
    icon: 'layout-dashboard',
    requiredPermission: null,
  },
  {
    label: 'Tickets',
    slug: 'tickets',
    icon: 'ticket',
    requiredPermission: 'tickets:read',
  },
  {
    label: 'Contatos',
    slug: 'contacts',
    icon: 'contact',
    requiredPermission: 'contacts:read',
  },
  {
    label: 'Usuários',
    slug: 'users',
    icon: 'users',
    requiredPermission: 'users:read',
  },
  {
    label: 'Roles',
    slug: 'roles',
    icon: 'shield',
    requiredPermission: 'roles:read',
  },
  {
    label: 'Permissões',
    slug: 'permissions',
    icon: 'lock',
    requiredPermission: 'permissions:read',
  },
];
