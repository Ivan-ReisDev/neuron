import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { WhatsappClientService } from './whatsapp-client.service';
import { WhatsappConversationRepository } from './repositories/whatsapp-conversation.repository';
import { WhatsappMessageRepository } from './repositories/whatsapp-message.repository';
import { WhatsappConversation } from './entities/whatsapp-conversation.entity';
import { WhatsappMessage } from './entities/whatsapp-message.entity';
import { ConversationStatus } from './enums/conversation-status.enum';
import { MessageSender } from './enums/message-sender.enum';
import {
  NOAH_SYSTEM_PROMPT,
  NOAH_FINALIZE_FUNCTION,
} from './constants/noah-system-prompt';
import { WHATSAPP_MESSAGES } from '../../shared/constants/exception-messages';
import { AI_PROVIDER } from '../../shared/providers/ai/ai-provider.interface';
import type { AiProvider } from '../../shared/providers/ai/ai-provider.interface';
import { AiModel } from '../../shared/providers/ai/enums/ai-model.enum';
import { AiMessage } from '../../shared/providers/ai/types/ai-completion.types';
import { PaginationQueryDto } from '../../shared/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../shared/dto/paginated-response.dto';
import { ContactPayload } from './types/contact-payload';
import { FinalizeArgs } from './types/finalize-args';

const ADMIN_PHONE_NUMBER = '5521985598348';
const CONVERSATION_EXPIRE_HOURS = 24;

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly aiModel: AiModel;
  private readonly providerName: string;

  constructor(
    private readonly whatsappClient: WhatsappClientService,
    private readonly conversationRepository: WhatsappConversationRepository,
    private readonly messageRepository: WhatsappMessageRepository,
    @Inject(AI_PROVIDER) private readonly aiProvider: AiProvider,
    private readonly configService: ConfigService,
  ) {
    this.providerName = this.configService.get<string>('AI_PROVIDER_NAME', 'gemini');
    this.aiModel =
      this.providerName === 'groq'
        ? AiModel.LLAMA_3_3_70B
        : AiModel.GEMINI_2_5_FLASH;
    this.logger.log(`AI Provider: ${this.providerName} (${this.aiModel})`);
  }

  @OnEvent('contact.created')
  async handleContactCreated(payload: Record<string, any>): Promise<void> {
    const contact = payload as unknown as ContactPayload;

    if (!contact.phone) {
      this.logger.warn(
        `Contato ${contact.name} sem telefone, ignorando WhatsApp`,
      );
      return;
    }

    if (!this.whatsappClient.getConnectionStatus()) {
      this.logger.warn('WhatsApp nao conectado, mensagem nao enviada');
      return;
    }

    try {
      await this.initiateConversation(contact);
    } catch (error) {
      this.logger.error(
        `Erro ao iniciar conversa com ${contact.name}: ${error}`,
      );
    }
  }

  @OnEvent('whatsapp.message')
  async handleIncomingMessage(payload: Record<string, any>): Promise<void> {
    const from = String(payload.from ?? '');
    const body = String(payload.body ?? '');

    if (!from || !body) {
      return;
    }

    const phoneNumber = this.normalizePhoneNumber(from.replace('@c.us', ''));

    this.logger.log(
      `Mensagem recebida de ${phoneNumber}: ${body.substring(0, 50)}...`,
    );

    const conversation =
      await this.conversationRepository.findActiveByPhoneNumber(phoneNumber);

    if (!conversation) {
      this.logger.log(`Nenhuma conversa ativa para ${phoneNumber}, ignorando`);
      return;
    }

    try {
      await this.processMessage(conversation, body);
    } catch (error) {
      this.logger.error(
        `Erro ao processar mensagem da conversa ${conversation.id}: ${error}`,
      );
    }
  }

  async findAllConversations(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<WhatsappConversation>> {
    return this.conversationRepository.findAll(query);
  }

  async findConversationById(id: string): Promise<WhatsappConversation> {
    const conversation =
      await this.conversationRepository.findByIdWithMessages(id);

    if (!conversation) {
      throw new NotFoundException(WHATSAPP_MESSAGES.CONVERSATION_NOT_FOUND(id));
    }

    return conversation;
  }

  private async initiateConversation(contact: ContactPayload): Promise<void> {
    const existingConversation =
      await this.conversationRepository.findActiveByContactId(contact.id);

    if (existingConversation) {
      this.logger.log(`Conversa ativa ja existe para contato ${contact.name}`);
      return;
    }

    const normalizedPhone = this.normalizePhoneNumber(contact.phone!);

    const conversation = await this.conversationRepository.create({
      contactId: contact.id,
      phoneNumber: normalizedPhone,
      status: ConversationStatus.ACTIVE,
    });

    this.logger.log(
      `Conversa criada para ${contact.name} (${normalizedPhone})`,
    );

    const greeting = this.buildGreetingMessage(contact);

    await this.sendAndSaveBotMessage(conversation, greeting);
  }

  private async processMessage(
    conversation: WhatsappConversation,
    userMessage: string,
  ): Promise<void> {
    if (this.isConversationExpired(conversation)) {
      await this.expireConversation(conversation);
      return;
    }

    await this.saveContactMessage(conversation, userMessage);

    const messages = await this.messageRepository.findByConversationId(
      conversation.id,
    );

    const aiMessages = this.buildAiMessages(messages, conversation);

    this.logger.log(
      `Enviando ${aiMessages.length} mensagens para ${this.providerName} (conversa ${conversation.id})`,
    );

    const response = await this.aiProvider.generateContent(aiMessages, {
      model: this.aiModel,
      systemInstruction: NOAH_SYSTEM_PROMPT,
      temperature: 0.7,
      maxOutputTokens: 500,
      functionDeclarations: [NOAH_FINALIZE_FUNCTION],
    });

    if (response.functionCalls?.length) {
      const finalizeCall = response.functionCalls.find(
        (fc) => fc.name === 'finalize_conversation',
      );

      if (finalizeCall) {
        this.logger.log(
          `${this.providerName} solicitou finalizacao da conversa ${conversation.id}`,
        );
        await this.finalizeConversation(
          conversation,
          finalizeCall.args as unknown as FinalizeArgs,
        );
        return;
      }
    }

    if (response.text) {
      this.logger.log(`Resposta ${this.providerName}: ${response.text.substring(0, 80)}...`);
      await this.sendAndSaveBotMessage(conversation, response.text);
    }
  }

  private async finalizeConversation(
    conversation: WhatsappConversation,
    args: FinalizeArgs,
  ): Promise<void> {
    const contactName = conversation.contact?.name ?? 'você';
    const farewellMessage = [
      `*${contactName}*, foi um prazer conversar com você! 😊`,
      '',
      `Já tenho todas as informações que preciso. Nossa *equipe técnica* vai analisar tudo e entrará em contato em breve para dar continuidade ao seu projeto.`,
      '',
      `Qualquer dúvida, estamos à disposição!`,
      `Obrigado pela confiança na *Ivan Reis Tecnologia*! 🚀`,
    ].join('\n');

    await this.sendAndSaveBotMessage(conversation, farewellMessage);

    const briefSummary = this.buildBriefSummary(conversation, args);

    await this.conversationRepository.update(conversation.id, {
      status: ConversationStatus.COMPLETED,
      summary: briefSummary,
      summarySentAt: new Date(),
    });

    await this.sendSummaryToAdmin(conversation, args);
  }

  private async sendSummaryToAdmin(
    conversation: WhatsappConversation,
    args: FinalizeArgs,
  ): Promise<void> {
    const brief = this.buildBriefSummary(conversation, args);

    try {
      await this.whatsappClient.sendMessage(ADMIN_PHONE_NUMBER, brief);
      this.logger.log(
        `Brief enviado para o admin sobre ${args.contactName ?? conversation.contact?.name}`,
      );
    } catch (error) {
      this.logger.error(`Erro ao enviar brief para admin: ${error}`);
    }
  }

  private buildBriefSummary(
    conversation: WhatsappConversation,
    args: FinalizeArgs,
  ): string {
    const contactName =
      args.contactName ?? conversation.contact?.name ?? 'Desconhecido';
    const phone = conversation.phoneNumber;
    const email = conversation.contact?.email ?? 'Não informado';

    const lines: string[] = [
      '📋 *BRIEF TÉCNICO — NOVO LEAD*',
      '━━━━━━━━━━━━━━━━━━━━━',
      '',
      `👤 *Contato:* ${contactName}`,
      `📱 *Telefone:* ${phone}`,
      `📧 *Email:* ${email}`,
    ];

    if (args.businessSummary) {
      lines.push(`🏢 *Negócio:* ${args.businessSummary}`);
    }

    lines.push('');
    lines.push('━━━━━━━━━━━━━━━━━━━━━');
    lines.push(`🎯 *Objetivo:* ${args.projectObjective}`);
    lines.push('');
    lines.push('⚙️ *Funcionalidades principais:*');
    lines.push(args.mainFeatures);

    if (args.integrations) {
      lines.push('');
      lines.push(`🔗 *Integrações:* ${args.integrations}`);
    }

    if (args.preferredStack) {
      lines.push(`💻 *Stack:* ${args.preferredStack}`);
    }

    if (args.hosting) {
      lines.push(`☁️ *Hospedagem:* ${args.hosting}`);
    }

    if (args.hasDesign) {
      lines.push(`🎨 *Design:* ${args.hasDesign}`);
    }

    lines.push('');
    lines.push('━━━━━━━━━━━━━━━━━━━━━');

    if (args.deadline) {
      lines.push(`📅 *Prazo:* ${args.deadline}`);
    }

    if (args.budget) {
      lines.push(`💰 *Orçamento:* ${args.budget}`);
    }

    lines.push(`🔴 *Urgência:* ${args.urgency}`);

    if (args.additionalNotes) {
      lines.push('');
      lines.push(`📝 *Notas:* ${args.additionalNotes}`);
    }

    lines.push('');
    lines.push('━━━━━━━━━━━━━━━━━━━━━');
    lines.push('_Gerado automaticamente pelo Noah Bot_');

    return lines.join('\n');
  }

  private async sendAndSaveBotMessage(
    conversation: WhatsappConversation,
    message: string,
  ): Promise<void> {
    await this.whatsappClient.sendMessage(conversation.phoneNumber, message);

    await this.messageRepository.create({
      conversationId: conversation.id,
      sender: MessageSender.BOT,
      content: message,
    });
  }

  private async saveContactMessage(
    conversation: WhatsappConversation,
    message: string,
  ): Promise<void> {
    await this.messageRepository.create({
      conversationId: conversation.id,
      sender: MessageSender.CONTACT,
      content: message,
    });
  }

  private async expireConversation(
    conversation: WhatsappConversation,
  ): Promise<void> {
    await this.conversationRepository.update(conversation.id, {
      status: ConversationStatus.EXPIRED,
    });

    this.logger.log(`Conversa ${conversation.id} expirada por inatividade`);
  }

  private buildGreetingMessage(contact: ContactPayload): string {
    return [
      `Olá, *${contact.name}*! 👋`,
      '',
      `Aqui é o *Noah*, assistente virtual da *Ivan Reis Tecnologia*.`,
      '',
      `Percebemos que você solicitou contato pelo nosso site sobre:`,
      `_"${contact.description}"_`,
      '',
      `Gostaria de conversar um pouco mais sobre isso? Estou aqui pra te ajudar!`,
    ].join('\n');
  }

  private buildAiMessages(
    messages: WhatsappMessage[],
    conversation: WhatsappConversation,
  ): AiMessage[] {
    const contactName = conversation.contact?.name ?? 'desconhecido';
    const contactDescription =
      conversation.contact?.description ?? 'sem descrição';
    const contactEmail = conversation.contact?.email ?? 'não informado';

    const contextMessage: AiMessage = {
      role: 'user',
      content:
        `[CONTEXTO INTERNO - não mencione isso ao cliente] ` +
        `Lead: ${contactName}, email: ${contactEmail}. ` +
        `Solicitou contato pelo site com a descrição: "${contactDescription}". ` +
        `A primeira mensagem de saudação já foi enviada. ` +
        `Continue a conversa naturalmente a partir do histórico abaixo.`,
    };

    const historyMessages: AiMessage[] = messages.map((msg) => ({
      role: msg.sender === MessageSender.BOT ? 'model' : 'user',
      content: msg.content,
    }));

    return [contextMessage, ...historyMessages];
  }

  private normalizePhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');

    if (cleaned.startsWith('55') && cleaned.length >= 12) {
      return cleaned;
    }

    if (cleaned.length === 11 || cleaned.length === 10) {
      return `55${cleaned}`;
    }

    return cleaned;
  }

  private isConversationExpired(conversation: WhatsappConversation): boolean {
    const hoursElapsed =
      (Date.now() - new Date(conversation.updatedAt).getTime()) /
      (1000 * 60 * 60);

    return hoursElapsed > CONVERSATION_EXPIRE_HOURS;
  }
}
