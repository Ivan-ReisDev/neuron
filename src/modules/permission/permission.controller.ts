import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PermissionService } from './permission.service';
import { Permission } from './entities/permission.entity';
import { PaginationQueryDto } from '../../shared/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../shared/dto/paginated-response.dto';
import { ParseUuidPipe } from '../../shared/pipes/parse-uuid.pipe';
import { RequirePermissions } from '../../shared/decorators/require-permissions.decorator';
import { Resource } from './enums/resource.enum';
import { Action } from './enums/action.enum';

@ApiTags('permissions')
@ApiBearerAuth()
@Controller('permissions')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Get()
  @RequirePermissions(Resource.PERMISSIONS, Action.READ)
  @ApiOperation({ summary: 'Listar todas as permissões com paginação' })
  @ApiResponse({ status: 200, description: 'Lista de permissões retornada' })
  @ApiResponse({ status: 401, description: 'Token não fornecido ou inválido' })
  @ApiResponse({ status: 403, description: 'Sem permissão para este recurso' })
  findAll(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<Permission>> {
    return this.permissionService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(Resource.PERMISSIONS, Action.READ)
  @ApiOperation({ summary: 'Buscar uma permissão pelo ID' })
  @ApiResponse({ status: 200, description: 'Permissão encontrada' })
  @ApiResponse({ status: 400, description: 'ID com formato inválido' })
  @ApiResponse({ status: 401, description: 'Token não fornecido ou inválido' })
  @ApiResponse({ status: 403, description: 'Sem permissão para este recurso' })
  @ApiResponse({ status: 404, description: 'Permissão não encontrada' })
  findById(@Param('id', ParseUuidPipe) id: string): Promise<Permission> {
    return this.permissionService.findById(id);
  }
}
