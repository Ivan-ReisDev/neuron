import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { MenuService } from './menu.service';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { JwtPayload } from '../auth/types/jwt-payload';
import { SidebarResponseItem } from './types/sidebar-item';
import { PageAccessResponse } from './types/page-access-response';

@ApiTags('menu')
@ApiBearerAuth()
@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get('sidebar')
  @ApiOperation({
    summary: 'Retornar itens do sidebar filtrados pelas permissões do usuário',
  })
  @ApiResponse({ status: 200, description: 'Itens do sidebar retornados' })
  @ApiResponse({ status: 401, description: 'Token não fornecido ou inválido' })
  getSidebar(@CurrentUser() currentUser: JwtPayload): SidebarResponseItem[] {
    return this.menuService.getSidebar(currentUser);
  }

  @Get('pages/:slug/access')
  @ApiOperation({
    summary: 'Verificar se o usuário tem acesso a uma página específica',
  })
  @ApiResponse({ status: 200, description: 'Verificação de acesso retornada' })
  @ApiResponse({ status: 401, description: 'Token não fornecido ou inválido' })
  checkPageAccess(
    @CurrentUser() currentUser: JwtPayload,
    @Param('slug') slug: string,
  ): PageAccessResponse {
    return this.menuService.checkPageAccess(currentUser, slug);
  }
}
