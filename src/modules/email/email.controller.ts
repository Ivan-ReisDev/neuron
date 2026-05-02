import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { EmailService } from '../../shared/providers/email/email.service';
import { EmailOptions } from '../../shared/providers/email/email.interface';
import { SendEmailDto } from './dto/send-email.dto';
import { RequirePermissions } from '../../shared/decorators/require-permissions.decorator';
import { Resource } from '../permission/enums/resource.enum';
import { Action } from '../permission/enums/action.enum';

@ApiTags('emails')
@Controller('emails')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('send')
  @HttpCode(200)
  @ApiBearerAuth()
  @RequirePermissions(Resource.USERS, Action.CREATE)
  @ApiOperation({ summary: 'Enviar um e-mail utilizando um template' })
  @ApiResponse({ status: 200, description: 'E-mail enviado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados de entrada inválidos' })
  @ApiResponse({ status: 401, description: 'Token não fornecido ou inválido' })
  @ApiResponse({ status: 500, description: 'Falha ao enviar o e-mail' })
  async send(@Body() sendEmailDto: SendEmailDto): Promise<{ message: string }> {
    const options: EmailOptions = {
      ...sendEmailDto,
      subject: sendEmailDto.subject ?? 'Currículo Desenvolvedor Full-Stack',
    };
    await this.emailService.send(options);
    return { message: 'E-mail enviado com sucesso' };
  }
}
