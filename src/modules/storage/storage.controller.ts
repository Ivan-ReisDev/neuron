import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiBody } from '@nestjs/swagger';
import { StorageService } from './storage.service';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { JwtPayload } from '../auth/types/jwt-payload';
import { UploadFileDto } from './dtos/upload-file.dto';
import { PaginationQueryDto } from 'src/shared/dto/pagination-query.dto';
import { ParseUuidPipe } from 'src/shared/pipes/parse-uuid.pipe';

const TEN_MB = 10 * 1024 * 1024;

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        folder: { type: 'string' },
      },
    },
  })
  async upload(
    @CurrentUser() user: JwtPayload,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: TEN_MB }),
          new FileTypeValidator({ fileType: /(image\/.+|application\/pdf)/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() dto: UploadFileDto,
  ) {
    return this.storageService.upload(file, user.sub, dto.folder);
  }

  @Get()
  async findAll(@Query() query: PaginationQueryDto) {
    return this.storageService.findAll(query);
  }

  @Get(':id')
  async findById(@Param('id', ParseUuidPipe) id: string) {
    return this.storageService.findById(id);
  }

  @Get(':id/url')
  async getSignedUrl(@Param('id', ParseUuidPipe) id: string) {
    return this.storageService.getSignedUrl(id);
  }

  @Delete(':id')
  async delete(@Param('id', ParseUuidPipe) id: string) {
    return this.storageService.delete(id);
  }
}
