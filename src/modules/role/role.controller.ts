import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from './entities/role.entity';
import { PaginationQueryDto } from '../../shared/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../shared/dto/paginated-response.dto';
import { ParseUuidPipe } from '../../shared/pipes/parse-uuid.pipe';
import { RequirePermissions } from '../../shared/decorators/require-permissions.decorator';
import { Resource } from '../permission/enums/resource.enum';
import { Action } from '../permission/enums/action.enum';

@ApiTags('roles')
@ApiBearerAuth()
@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  @RequirePermissions(Resource.ROLES, Action.READ)
  @ApiOperation({ summary: 'Listar todas as roles com paginação' })
  @ApiResponse({ status: 200, description: 'Lista de roles retornada' })
  @ApiResponse({ status: 401, description: 'Token não fornecido ou inválido' })
  @ApiResponse({ status: 403, description: 'Sem permissão para este recurso' })
  findAll(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<Role>> {
    return this.roleService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(Resource.ROLES, Action.READ)
  @ApiOperation({ summary: 'Buscar uma role pelo ID' })
  @ApiResponse({ status: 200, description: 'Role encontrada' })
  @ApiResponse({ status: 400, description: 'ID com formato inválido' })
  @ApiResponse({ status: 401, description: 'Token não fornecido ou inválido' })
  @ApiResponse({ status: 403, description: 'Sem permissão para este recurso' })
  @ApiResponse({ status: 404, description: 'Role não encontrada' })
  findById(@Param('id', ParseUuidPipe) id: string): Promise<Role> {
    return this.roleService.findById(id);
  }

  @Post()
  @RequirePermissions(Resource.ROLES, Action.CREATE)
  @ApiOperation({ summary: 'Criar uma nova role' })
  @ApiResponse({ status: 201, description: 'Role criada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados de entrada inválidos' })
  @ApiResponse({ status: 401, description: 'Token não fornecido ou inválido' })
  @ApiResponse({ status: 403, description: 'Sem permissão para este recurso' })
  @ApiResponse({ status: 409, description: 'Nome já cadastrado' })
  create(@Body() createRoleDto: CreateRoleDto): Promise<Role> {
    return this.roleService.create(createRoleDto);
  }

  @Patch(':id')
  @RequirePermissions(Resource.ROLES, Action.UPDATE)
  @ApiOperation({ summary: 'Atualizar parcialmente uma role' })
  @ApiResponse({ status: 200, description: 'Role atualizada com sucesso' })
  @ApiResponse({ status: 400, description: 'ID com formato inválido' })
  @ApiResponse({ status: 401, description: 'Token não fornecido ou inválido' })
  @ApiResponse({ status: 403, description: 'Sem permissão para este recurso' })
  @ApiResponse({ status: 404, description: 'Role não encontrada' })
  @ApiResponse({ status: 409, description: 'Nome já cadastrado' })
  update(
    @Param('id', ParseUuidPipe) id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ): Promise<Role> {
    return this.roleService.update(id, updateRoleDto);
  }

  @Delete(':id')
  @HttpCode(204)
  @RequirePermissions(Resource.ROLES, Action.DELETE)
  @ApiOperation({ summary: 'Remover uma role' })
  @ApiResponse({ status: 204, description: 'Role removida com sucesso' })
  @ApiResponse({ status: 400, description: 'ID com formato inválido' })
  @ApiResponse({ status: 401, description: 'Token não fornecido ou inválido' })
  @ApiResponse({ status: 403, description: 'Sem permissão para este recurso' })
  @ApiResponse({ status: 404, description: 'Role não encontrada' })
  remove(@Param('id', ParseUuidPipe) id: string): Promise<void> {
    return this.roleService.remove(id);
  }
}
