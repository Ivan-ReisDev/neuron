import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { WhatsappClientService } from '../whatsapp/whatsapp-client.service';
import { InvoiceRepository } from './repository/invoice.repository';
import { Invoice } from './repository/invoice.entity';

@Injectable()
export class InvoiceNotificationService {
  private readonly logger = new Logger(InvoiceNotificationService.name);
  private readonly pixKey: string;

  constructor(
    private readonly invoiceRepository: InvoiceRepository,
    private readonly whatsappClient: WhatsappClientService,
    private readonly configService: ConfigService,
  ) {
    this.pixKey = this.configService.get<string>('PIX_KEY', '');
    if (!this.pixKey) {
      this.logger.warn('PIX_KEY nao configurada no .env');
    }
  }

  @Cron('0 10 * * *')
  async handleDailyInvoiceNotifications(): Promise<void> {
    this.logger.log('Iniciando verificacao diaria de faturas...');

    if (!this.whatsappClient.getConnectionStatus()) {
      this.logger.warn('WhatsApp nao conectado, notificacoes nao enviadas');
      return;
    }

    const today = new Date();

    const twoDaysFromNow = new Date(today);
    twoDaysFromNow.setDate(today.getDate() + 2);

    const [reminderInvoices, dueTodayInvoices, overdueInvoices] =
      await Promise.all([
        this.invoiceRepository.findUnpaidByDueDate(twoDaysFromNow),
        this.invoiceRepository.findUnpaidByDueDate(today),
        this.invoiceRepository.findOverdue(),
      ]);

    this.logger.log(
      `Faturas encontradas — lembrete: ${reminderInvoices.length}, vence hoje: ${dueTodayInvoices.length}, vencidas: ${overdueInvoices.length}`,
    );

    for (const invoice of reminderInvoices) {
      await this.sendNotification(invoice, 'reminder');
    }

    for (const invoice of dueTodayInvoices) {
      await this.sendNotification(invoice, 'due_today');
    }

    for (const invoice of overdueInvoices) {
      await this.sendNotification(invoice, 'overdue');
    }

    this.logger.log('Verificacao diaria de faturas concluida');
  }

  async notifyInvoice(invoiceId: string): Promise<void> {
    const invoice = await this.invoiceRepository.findById(invoiceId);

    if (!invoice) {
      throw new NotFoundException(`Fatura ${invoiceId} nao encontrada`);
    }

    if (invoice.paidAt) {
      this.logger.log(`Fatura ${invoiceId} ja esta paga, ignorando`);
      return;
    }

    if (!this.whatsappClient.getConnectionStatus()) {
      throw new Error('WhatsApp nao conectado');
    }

    const today = new Date();
    const dueDate = new Date(invoice.dueDate);
    const diffDays = Math.ceil(
      (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    let type: 'reminder' | 'due_today' | 'overdue';
    if (diffDays < 0) {
      type = 'overdue';
    } else if (diffDays === 0) {
      type = 'due_today';
    } else {
      type = 'reminder';
    }

    // Carregar user se nao estiver carregado
    if (!invoice.user) {
      const full = await this.invoiceRepository.findById(invoiceId);
      invoice.user = full.user;
    }

    await this.sendNotification(invoice, type);
  }

  private async sendNotification(
    invoice: Invoice,
    type: 'reminder' | 'due_today' | 'overdue',
  ): Promise<void> {
    const phone = invoice.user?.phone;

    if (!phone) {
      this.logger.warn(
        `Usuario ${invoice.user?.name ?? invoice.userId} sem telefone, ignorando fatura ${invoice.id}`,
      );
      return;
    }

    const message = this.buildMessage(invoice, type);

    try {
      await this.whatsappClient.sendMessage(phone, message);
      this.logger.log(
        `Notificacao [${type}] enviada para ${invoice.user.name} (${phone}) — fatura ${invoice.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Erro ao enviar notificacao para ${phone}: ${error}`,
      );
    }
  }

  private buildMessage(
    invoice: Invoice,
    type: 'reminder' | 'due_today' | 'overdue',
  ): string {
    const nome = invoice.user?.name ?? 'Cliente';
    const valor = Number(invoice.amount).toFixed(2).replace('.', ',');
    const dataVencimento = this.formatDate(new Date(invoice.dueDate));
    const descricao = invoice.description;
    const chavePix = this.pixKey || 'Nao configurada';

    const templates = {
      reminder: [
        `Ola, *${nome}*! 👋`,
        '',
        `Passando para lembrar que sua fatura vence em *2 dias* (${dataVencimento}).`,
        '',
        `📄 *${descricao}*`,
        `💰 Valor: *R$ ${valor}*`,
        '',
        `🔑 Chave PIX: *${chavePix}*`,
        '',
        `Qualquer duvida, estamos a disposicao!`,
      ],
      due_today: [
        `Ola, *${nome}*! ⚠️`,
        '',
        `Sua fatura vence *hoje* (${dataVencimento}).`,
        '',
        `📄 *${descricao}*`,
        `💰 Valor: *R$ ${valor}*`,
        '',
        `🔑 Chave PIX: *${chavePix}*`,
        '',
        `Evite juros, pague hoje mesmo!`,
      ],
      overdue: [
        `Ola, *${nome}*! 🚨`,
        '',
        `Sua fatura esta *vencida* desde ${dataVencimento}.`,
        '',
        `📄 *${descricao}*`,
        `💰 Valor: *R$ ${valor}*`,
        '',
        `🔑 Chave PIX: *${chavePix}*`,
        '',
        `Por favor, regularize o quanto antes. Qualquer duvida, entre em contato!`,
      ],
    };

    return templates[type].join('\n');
  }

  private formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
}
