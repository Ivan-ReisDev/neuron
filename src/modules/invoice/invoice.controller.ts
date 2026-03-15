import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  HttpCode,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiBody, ApiTags } from '@nestjs/swagger';
import { InvoiceService } from './invoice.service';
import { InvoiceNotificationService } from './invoice-notification.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { RequirePermissions } from 'src/shared/decorators/require-permissions.decorator';
import { JwtPayload } from '../auth/types/jwt-payload';
import { PaginationQueryDto } from 'src/shared/dto/pagination-query.dto';
import { ParseUuidPipe } from 'src/shared/pipes/parse-uuid.pipe';
import { Resource } from '../permission/enums/resource.enum';
import { Action } from '../permission/enums/action.enum';

const TEN_MB = 10 * 1024 * 1024;

@ApiTags('invoices')
@ApiBearerAuth()
@Controller('invoices')
export class InvoiceController {
  constructor(
    private readonly invoiceService: InvoiceService,
    private readonly invoiceNotificationService: InvoiceNotificationService,
  ) {}

  @Post()
  @RequirePermissions(Resource.INVOICES, Action.CREATE)
  async create(@Body() dto: CreateInvoiceDto) {
    return this.invoiceService.create(dto);
  }

  @Get()
  @RequirePermissions(Resource.INVOICES, Action.READ)
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: PaginationQueryDto,
  ) {
    return this.invoiceService.findAll(user, query);
  }

  @Get(':id')
  @RequirePermissions(Resource.INVOICES, Action.READ)
  async findById(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUuidPipe) id: string,
  ) {
    return this.invoiceService.findById(user, id);
  }

  @Patch(':id')
  @RequirePermissions(Resource.INVOICES, Action.UPDATE)
  async update(
    @Param('id', ParseUuidPipe) id: string,
    @Body() dto: UpdateInvoiceDto,
  ) {
    return this.invoiceService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @RequirePermissions(Resource.INVOICES, Action.DELETE)
  async remove(@Param('id', ParseUuidPipe) id: string) {
    return this.invoiceService.remove(id);
  }

  @Post(':id/nota-fiscal')
  @RequirePermissions(Resource.INVOICES, Action.UPDATE)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  async uploadNotaFiscal(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUuidPipe) id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: TEN_MB }),
          new FileTypeValidator({ fileType: /(image\/.+|application\/pdf)/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.invoiceService.uploadNotaFiscal(id, file, user.sub);
  }

  @Post(':id/comprovante')
  @RequirePermissions(Resource.INVOICES, Action.UPDATE)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  async uploadComprovante(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUuidPipe) id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: TEN_MB }),
          new FileTypeValidator({ fileType: /(image\/.+|application\/pdf)/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.invoiceService.uploadComprovante(id, file, user.sub);
  }

  @Delete(':id/comprovantes/:fileId')
  @RequirePermissions(Resource.INVOICES, Action.UPDATE)
  async removeComprovante(
    @Param('id', ParseUuidPipe) id: string,
    @Param('fileId', ParseUuidPipe) fileId: string,
  ) {
    return await this.invoiceService.removeComprovante(id, fileId);
  }

  @Get(':id/nota-fiscal/url')
  @RequirePermissions(Resource.INVOICES, Action.READ)
  async getNotaFiscalUrl(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUuidPipe) id: string,
  ) {
    return this.invoiceService.getNotaFiscalUrl(user, id);
  }

  @Get(':id/comprovantes/:fileId/url')
  @RequirePermissions(Resource.INVOICES, Action.UPDATE)
  async getComprovanteUrl(
    @Param('id', ParseUuidPipe) id: string,
    @Param('fileId', ParseUuidPipe) fileId: string,
  ) {
    return this.invoiceService.getComprovanteUrl(id, fileId);
  }

  @Post(':id/notify')
  @RequirePermissions(Resource.INVOICES, Action.UPDATE)
  async notifyInvoice(@Param('id', ParseUuidPipe) id: string) {
    await this.invoiceNotificationService.notifyInvoice(id);
    return { message: 'Notificacao enviada com sucesso' };
  }
}
