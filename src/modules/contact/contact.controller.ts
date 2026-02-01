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
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { Contact } from './entities/contact.entity';
import { PaginationQueryDto } from '../../shared/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../shared/dto/paginated-response.dto';
import { ParseUuidPipe } from '../../shared/pipes/parse-uuid.pipe';
import { Public } from '../../shared/decorators/public.decorator';
import { RequirePermissions } from '../../shared/decorators/require-permissions.decorator';
import { Resource } from '../permission/enums/resource.enum';
import { Action } from '../permission/enums/action.enum';

@ApiTags('contacts')
@Controller('contacts')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Listar todos os contatos com paginação' })
  @ApiResponse({ status: 200, description: 'Lista de contatos retornada' })
  findAll(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<Contact>> {
    return this.contactService.findAll(query);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Buscar um contato pelo ID' })
  @ApiResponse({ status: 200, description: 'Contato encontrado' })
  @ApiResponse({ status: 400, description: 'ID com formato inválido' })
  @ApiResponse({ status: 404, description: 'Contato não encontrado' })
  findById(@Param('id', ParseUuidPipe) id: string): Promise<Contact> {
    return this.contactService.findById(id);
  }

  @Post()
  @Public()
  @ApiOperation({ summary: 'Criar um novo contato' })
  @ApiResponse({ status: 201, description: 'Contato criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados de entrada inválidos' })
  create(@Body() createContactDto: CreateContactDto): Promise<Contact> {
    return this.contactService.create(createContactDto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @RequirePermissions(Resource.CONTACTS, Action.UPDATE)
  @ApiOperation({ summary: 'Atualizar parcialmente um contato' })
  @ApiResponse({ status: 200, description: 'Contato atualizado com sucesso' })
  @ApiResponse({ status: 400, description: 'ID com formato inválido' })
  @ApiResponse({ status: 401, description: 'Token não fornecido ou inválido' })
  @ApiResponse({ status: 403, description: 'Sem permissão para este recurso' })
  @ApiResponse({ status: 404, description: 'Contato não encontrado' })
  update(
    @Param('id', ParseUuidPipe) id: string,
    @Body() updateContactDto: UpdateContactDto,
  ): Promise<Contact> {
    return this.contactService.update(id, updateContactDto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiBearerAuth()
  @RequirePermissions(Resource.CONTACTS, Action.DELETE)
  @ApiOperation({ summary: 'Remover um contato' })
  @ApiResponse({ status: 204, description: 'Contato removido com sucesso' })
  @ApiResponse({ status: 400, description: 'ID com formato inválido' })
  @ApiResponse({ status: 401, description: 'Token não fornecido ou inválido' })
  @ApiResponse({ status: 403, description: 'Sem permissão para este recurso' })
  @ApiResponse({ status: 404, description: 'Contato não encontrado' })
  remove(@Param('id', ParseUuidPipe) id: string): Promise<void> {
    return this.contactService.remove(id);
  }
}
