import { readFile } from 'node:fs/promises';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { Resend } from 'resend';
import { EMAIL_MESSAGES } from '../../constants/exception-messages';
import { EmailAttachment, EmailOptions } from './email.interface';
import { getEmailTemplate } from './templates/email-template.registry';

@Injectable()
export class EmailService {
  private readonly resend: Resend;
  private readonly fromAddress: string;
  private readonly replyToAddress: string;
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY') ?? '';
    this.fromAddress =
      this.configService.get<string>('RESEND_FROM') ??
      'onboarding@resend.dev';
    this.replyToAddress =
      this.configService.get<string>('RESEND_REPLY_TO') ?? '';

    this.resend = new Resend(apiKey);
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
      const resolvedAttachments = await this.resolveAttachments(attachments);

      const recipients = Array.isArray(to) ? to : [to];

      const { data, error } = await this.resend.emails.send({
        from: this.fromAddress,
        to: recipients,
        subject,
        html,
        replyTo: this.replyToAddress || undefined,
        attachments: resolvedAttachments,
      });

      if (error) {
        throw new Error(`${error.name}: ${error.message}`);
      }

      this.logger.log(
        `E-mail enviado [${data?.id}] para ${recipients.join(', ')} — assunto: "${subject}"`,
      );
    } catch (error) {
      this.logger.error(`Falha ao enviar e-mail: ${error}`);
      throw new InternalServerErrorException(EMAIL_MESSAGES.SEND_FAILED);
    }
  }

  private async resolveAttachments(
    attachments?: EmailAttachment[],
  ): Promise<{ filename: string; content: Buffer }[] | undefined> {
    if (!attachments?.length) {
      return undefined;
    }

    return Promise.all(
      attachments.map(async ({ filename, path }) => ({
        filename,
        content: await readFile(path),
      })),
    );
  }

  @OnEvent('email.send')
  async handleEmailSendEvent(payload: Record<string, any>): Promise<void> {
    await this.send(payload as EmailOptions);
  }
}
