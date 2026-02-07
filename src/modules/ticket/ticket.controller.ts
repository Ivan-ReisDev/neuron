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
import { TicketService } from './ticket.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { Ticket } from './entities/ticket.entity';
import { PaginationQueryDto } from '../../shared/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../shared/dto/paginated-response.dto';
import { ParseUuidPipe } from '../../shared/pipes/parse-uuid.pipe';
import { RequirePermissions } from '../../shared/decorators/require-permissions.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { JwtPayload } from '../auth/types/jwt-payload';
import { Resource } from '../permission/enums/resource.enum';
import { Action } from '../permission/enums/action.enum';

@ApiTags('tickets')
@ApiBearerAuth()
@Controller('tickets')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Get()
  @RequirePermissions(Resource.TICKETS, Action.READ)
  @ApiOperation({
    summary: 'Listar tickets (ADMIN vê todos, USER vê apenas os seus)',
  })
  @ApiResponse({ status: 200, description: 'Lista de tickets retornada' })
  @ApiResponse({ status: 401, description: 'Token não fornecido ou inválido' })
  @ApiResponse({ status: 403, description: 'Sem permissão para este recurso' })
  findAll(
    @CurrentUser() currentUser: JwtPayload,
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<Ticket>> {
    return this.ticketService.findAll(currentUser, query);
  }

  @Get(':id')
  @RequirePermissions(Resource.TICKETS, Action.READ)
  @ApiOperation({
    summary: 'Buscar ticket pelo ID (USER só acessa os seus)',
  })
  @ApiResponse({ status: 200, description: 'Ticket encontrado' })
  @ApiResponse({ status: 400, description: 'ID com formato inválido' })
  @ApiResponse({ status: 401, description: 'Token não fornecido ou inválido' })
  @ApiResponse({ status: 403, description: 'Sem permissão para este recurso' })
  @ApiResponse({ status: 404, description: 'Ticket não encontrado' })
  findById(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id', ParseUuidPipe) id: string,
  ): Promise<Ticket> {
    return this.ticketService.findById(currentUser, id);
  }

  @Post()
  @RequirePermissions(Resource.TICKETS, Action.CREATE)
  @ApiOperation({ summary: 'Criar um novo ticket' })
  @ApiResponse({ status: 201, description: 'Ticket criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados de entrada inválidos' })
  @ApiResponse({ status: 401, description: 'Token não fornecido ou inválido' })
  @ApiResponse({ status: 403, description: 'Sem permissão para este recurso' })
  create(
    @CurrentUser() currentUser: JwtPayload,
    @Body() createTicketDto: CreateTicketDto,
  ): Promise<Ticket> {
    return this.ticketService.create(currentUser, createTicketDto);
  }

  @Patch(':id')
  @RequirePermissions(Resource.TICKETS, Action.UPDATE)
  @ApiOperation({ summary: 'Atualizar parcialmente um ticket (apenas ADMIN)' })
  @ApiResponse({ status: 200, description: 'Ticket atualizado com sucesso' })
  @ApiResponse({ status: 400, description: 'ID com formato inválido' })
  @ApiResponse({ status: 401, description: 'Token não fornecido ou inválido' })
  @ApiResponse({ status: 403, description: 'Sem permissão para este recurso' })
  @ApiResponse({ status: 404, description: 'Ticket não encontrado' })
  update(
    @Param('id', ParseUuidPipe) id: string,
    @Body() updateTicketDto: UpdateTicketDto,
  ): Promise<Ticket> {
    return this.ticketService.update(id, updateTicketDto);
  }

  @Delete(':id')
  @HttpCode(204)
  @RequirePermissions(Resource.TICKETS, Action.DELETE)
  @ApiOperation({ summary: 'Remover um ticket (apenas ADMIN)' })
  @ApiResponse({ status: 204, description: 'Ticket removido com sucesso' })
  @ApiResponse({ status: 400, description: 'ID com formato inválido' })
  @ApiResponse({ status: 401, description: 'Token não fornecido ou inválido' })
  @ApiResponse({ status: 403, description: 'Sem permissão para este recurso' })
  @ApiResponse({ status: 404, description: 'Ticket não encontrado' })
  remove(@Param('id', ParseUuidPipe) id: string): Promise<void> {
    return this.ticketService.remove(id);
  }
}
