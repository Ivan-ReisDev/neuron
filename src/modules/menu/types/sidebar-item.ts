import { ApiProperty } from '@nestjs/swagger';

export interface SidebarItem {
  label: string;
  slug: string;
  icon: string;
  requiredPermission: string | null;
}

export class SidebarResponseItem {
  @ApiProperty({ description: 'Nome exibido no menu', example: 'Tickets' })
  label: string;

  @ApiProperty({ description: 'Identificador da rota', example: 'tickets' })
  slug: string;

  @ApiProperty({ description: 'Nome do ícone', example: 'ticket' })
  icon: string;
}
