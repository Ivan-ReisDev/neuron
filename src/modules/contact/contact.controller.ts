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
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { Contact } from './entities/contact.entity';
import { PaginationQueryDto } from '../../shared/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../shared/dto/paginated-response.dto';
import { ParseUuidPipe } from '../../shared/pipes/parse-uuid.pipe';

@ApiTags('contacts')
@Controller('contacts')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos os contatos com paginação' })
  @ApiResponse({ status: 200, description: 'Lista de contatos retornada' })
  findAll(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<Contact>> {
    return this.contactService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar um contato pelo ID' })
  @ApiResponse({ status: 200, description: 'Contato encontrado' })
  @ApiResponse({ status: 400, description: 'ID com formato inválido' })
  @ApiResponse({ status: 404, description: 'Contato não encontrado' })
  findById(@Param('id', ParseUuidPipe) id: string): Promise<Contact> {
    return this.contactService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar um novo contato' })
  @ApiResponse({ status: 201, description: 'Contato criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados de entrada inválidos' })
  create(@Body() createContactDto: CreateContactDto): Promise<Contact> {
    return this.contactService.create(createContactDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar parcialmente um contato' })
  @ApiResponse({ status: 200, description: 'Contato atualizado com sucesso' })
  @ApiResponse({ status: 400, description: 'ID com formato inválido' })
  @ApiResponse({ status: 404, description: 'Contato não encontrado' })
  update(
    @Param('id', ParseUuidPipe) id: string,
    @Body() updateContactDto: UpdateContactDto,
  ): Promise<Contact> {
    return this.contactService.update(id, updateContactDto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remover um contato' })
  @ApiResponse({ status: 204, description: 'Contato removido com sucesso' })
  @ApiResponse({ status: 400, description: 'ID com formato inválido' })
  @ApiResponse({ status: 404, description: 'Contato não encontrado' })
  remove(@Param('id', ParseUuidPipe) id: string): Promise<void> {
    return this.contactService.remove(id);
  }
}
