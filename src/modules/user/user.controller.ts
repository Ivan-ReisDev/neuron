import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { PaginationQueryDto } from '../../shared/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../shared/dto/paginated-response.dto';
import { ParseUuidPipe } from '../../shared/pipes/parse-uuid.pipe';
import { RequirePermissions } from '../../shared/decorators/require-permissions.decorator';
import { Resource } from '../permission/enums/resource.enum';
import { Action } from '../permission/enums/action.enum';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @RequirePermissions(Resource.USERS, Action.READ)
  @ApiOperation({ summary: 'Listar todos os usuários com paginação' })
  @ApiResponse({ status: 200, description: 'Lista de usuários retornada' })
  @ApiResponse({ status: 401, description: 'Token não fornecido ou inválido' })
  @ApiResponse({ status: 403, description: 'Sem permissão para este recurso' })
  findAll(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<User>> {
    return this.userService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(Resource.USERS, Action.READ)
  @ApiOperation({ summary: 'Buscar um usuário pelo ID' })
  @ApiResponse({ status: 200, description: 'Usuário encontrado' })
  @ApiResponse({ status: 400, description: 'ID com formato inválido' })
  @ApiResponse({ status: 401, description: 'Token não fornecido ou inválido' })
  @ApiResponse({ status: 403, description: 'Sem permissão para este recurso' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  findById(@Param('id', ParseUuidPipe) id: string): Promise<User> {
    return this.userService.findById(id);
  }

  @Post()
  @RequirePermissions(Resource.USERS, Action.CREATE)
  @ApiOperation({ summary: 'Criar um novo usuário' })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados de entrada inválidos' })
  @ApiResponse({ status: 401, description: 'Token não fornecido ou inválido' })
  @ApiResponse({ status: 403, description: 'Sem permissão para este recurso' })
  @ApiResponse({ status: 409, description: 'Email já cadastrado' })
  create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.userService.create(createUserDto);
  }

  @Patch(':id')
  @RequirePermissions(Resource.USERS, Action.UPDATE)
  @ApiOperation({ summary: 'Atualizar parcialmente um usuário' })
  @ApiResponse({ status: 200, description: 'Usuário atualizado com sucesso' })
  @ApiResponse({ status: 400, description: 'ID com formato inválido' })
  @ApiResponse({ status: 401, description: 'Token não fornecido ou inválido' })
  @ApiResponse({ status: 403, description: 'Sem permissão para este recurso' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiResponse({ status: 409, description: 'Email já cadastrado' })
  update(
    @Param('id', ParseUuidPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(204)
  @RequirePermissions(Resource.USERS, Action.DELETE)
  @ApiOperation({ summary: 'Remover um usuário' })
  @ApiResponse({ status: 204, description: 'Usuário removido com sucesso' })
  @ApiResponse({ status: 400, description: 'ID com formato inválido' })
  @ApiResponse({ status: 401, description: 'Token não fornecido ou inválido' })
  @ApiResponse({ status: 403, description: 'Sem permissão para este recurso' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  remove(@Param('id', ParseUuidPipe) id: string): Promise<void> {
    return this.userService.remove(id);
  }
}
