import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { WhatsappService } from './whatsapp.service';
import { WhatsappClientService } from './whatsapp-client.service';
import { WhatsappConversation } from './entities/whatsapp-conversation.entity';
import { PaginationQueryDto } from '../../shared/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../shared/dto/paginated-response.dto';
import { ParseUuidPipe } from '../../shared/pipes/parse-uuid.pipe';
import { RequirePermissions } from '../../shared/decorators/require-permissions.decorator';
import { Resource } from '../permission/enums/resource.enum';
import { Action } from '../permission/enums/action.enum';

@ApiTags('whatsapp')
@ApiBearerAuth()
@Controller('whatsapp')
export class WhatsappController {
  constructor(
    private readonly whatsappService: WhatsappService,
    private readonly whatsappClient: WhatsappClientService,
  ) {}

  @Get('status')
  @RequirePermissions(Resource.WHATSAPP_CONVERSATIONS, Action.READ)
  @ApiOperation({ summary: 'Verificar status da conexao WhatsApp' })
  @ApiResponse({
    status: 200,
    description: 'Status da conexao retornado',
  })
  @ApiResponse({
    status: 401,
    description: 'Token nao fornecido ou invalido',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissao para este recurso',
  })
  getStatus(): { connected: boolean } {
    return { connected: this.whatsappClient.getConnectionStatus() };
  }

  @Get('conversations')
  @RequirePermissions(Resource.WHATSAPP_CONVERSATIONS, Action.READ)
  @ApiOperation({
    summary: 'Listar todas as conversas WhatsApp com paginacao',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de conversas retornada',
  })
  @ApiResponse({
    status: 401,
    description: 'Token nao fornecido ou invalido',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissao para este recurso',
  })
  findAllConversations(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<WhatsappConversation>> {
    return this.whatsappService.findAllConversations(query);
  }

  @Get('conversations/:id')
  @RequirePermissions(Resource.WHATSAPP_CONVERSATIONS, Action.READ)
  @ApiOperation({
    summary: 'Buscar detalhes de uma conversa WhatsApp com mensagens',
  })
  @ApiResponse({
    status: 200,
    description: 'Conversa encontrada com mensagens',
  })
  @ApiResponse({
    status: 400,
    description: 'ID com formato invalido',
  })
  @ApiResponse({
    status: 401,
    description: 'Token nao fornecido ou invalido',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissao para este recurso',
  })
  @ApiResponse({
    status: 404,
    description: 'Conversa nao encontrada',
  })
  findConversationById(
    @Param('id', ParseUuidPipe) id: string,
  ): Promise<WhatsappConversation> {
    return this.whatsappService.findConversationById(id);
  }
}
