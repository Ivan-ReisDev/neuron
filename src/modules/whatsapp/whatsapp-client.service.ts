import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { Client, LocalAuth, Message } from 'whatsapp-web.js';
import * as qrcode from 'qrcode-terminal';

const WHATSAPP_READY_EVENT = 'whatsapp.ready';
const WHATSAPP_MESSAGE_EVENT = 'whatsapp.message';
const WHATSAPP_DISCONNECTED_EVENT = 'whatsapp.disconnected';

@Injectable()
export class WhatsappClientService implements OnModuleInit, OnModuleDestroy {
  private client: Client;
  private isReady = false;
  private readonly logger = new Logger(WhatsappClientService.name);

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit(): void {
    this.initializeClient();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.destroy();
    }
  }

  getConnectionStatus(): boolean {
    return this.isReady;
  }

  async sendMessage(phoneNumber: string, message: string): Promise<void> {
    if (!this.isReady) {
      throw new Error('WhatsApp client is not ready');
    }

    const chatId = await this.resolveContactId(phoneNumber);
    await this.client.sendMessage(chatId, message);
  }

  private initializeClient(): void {
    const chromiumPath = this.configService.get<string>('CHROMIUM_PATH');

    const puppeteerOptions: Record<string, unknown> = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
      ],
    };

    if (chromiumPath) {
      puppeteerOptions.executablePath = chromiumPath;
    }

    this.client = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: puppeteerOptions,
    });

    this.registerEventHandlers();
    void this.client.initialize();
  }

  private registerEventHandlers(): void {
    this.client.on('qr', (qr: string) => {
      this.logger.log('QR Code recebido. Escaneie com seu WhatsApp:');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      qrcode.generate(qr, { small: true });
    });

    this.client.on('ready', () => {
      this.isReady = true;
      this.logger.log('Cliente WhatsApp conectado e pronto');
      this.eventEmitter.emit(WHATSAPP_READY_EVENT);
    });

    this.client.on('authenticated', () => {
      this.logger.log('Cliente WhatsApp autenticado');
    });

    this.client.on('auth_failure', (message: string) => {
      this.isReady = false;
      this.logger.error(`Falha na autenticacao do WhatsApp: ${message}`);
    });

    this.client.on('disconnected', (reason: string) => {
      this.isReady = false;
      this.logger.warn(`WhatsApp desconectado: ${reason}`);
      this.eventEmitter.emit(WHATSAPP_DISCONNECTED_EVENT, reason);
    });

    this.client.on('message', (message: Message) => {
      if (message.fromMe) {
        return;
      }

      void this.resolveAndEmitMessage(message);
    });
  }

  private async resolveAndEmitMessage(message: Message): Promise<void> {
    try {
      const contact = await message.getContact();
      const phoneNumber = contact.number;

      this.logger.log(`Mensagem de ${phoneNumber} (from: ${message.from})`);

      this.eventEmitter.emit(WHATSAPP_MESSAGE_EVENT, {
        from: phoneNumber,
        body: message.body,
      });
    } catch (error) {
      this.logger.error(`Erro ao resolver contato da mensagem: ${error}`);
    }
  }

  private async resolveContactId(phoneNumber: string): Promise<string> {
    const cleaned = phoneNumber.replace(/\D/g, '');

    const numberId = await this.client.getNumberId(cleaned);

    if (numberId) {
      return numberId._serialized;
    }

    return `${cleaned}@c.us`;
  }
}
