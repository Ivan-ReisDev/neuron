import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { createTransport, Transporter } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import { EMAIL_MESSAGES } from '../../constants/exception-messages';
import { EmailAttachment, EmailOptions } from './email.interface';
import { getEmailTemplate } from './templates/email-template.registry';

@Injectable()
export class EmailService {
  private readonly transporter: Transporter;
  private readonly fromAddress: string;
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {
    const user = this.configService.get<string>('GMAIL_USER');
    const pass = this.configService.get<string>('GMAIL_APP_PASSWORD');

    this.fromAddress = user ?? '';

    const options = {
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user, pass },
      family: 4,
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    } satisfies SMTPTransport.Options & { family: number };

    this.transporter = createTransport(options);
  }

  async send(options: EmailOptions): Promise<void> {
    const template = getEmailTemplate(options.template);

    if (!template) {
      throw new InternalServerErrorException(
        EMAIL_MESSAGES.INVALID_TEMPLATE(options.template),
      );
    }

    const html = template.render(options.context ?? {});
    const attachments = [
      ...(options.attachments ?? []),
      ...(template.getAttachments?.() ?? []),
    ];
    await this.sendRaw(options.to, options.subject, html, attachments);
  }

  async sendRaw(
    to: string | string[],
    subject: string,
    html: string,
    attachments?: EmailAttachment[],
  ): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html,
        attachments: attachments?.map((a) => ({
          filename: a.filename,
          path: a.path,
        })),
      });
    } catch (error) {
      this.logger.error(`Falha ao enviar e-mail: ${error}`);
      throw new InternalServerErrorException(EMAIL_MESSAGES.SEND_FAILED);
    }
  }

  @OnEvent('email.send')
  async handleEmailSendEvent(payload: Record<string, any>): Promise<void> {
    await this.send(payload as EmailOptions);
  }
}
