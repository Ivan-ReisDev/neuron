import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../../../shared/repositories/base.repository';
import { WhatsappConversation } from '../entities/whatsapp-conversation.entity';
import { ConversationStatus } from '../enums/conversation-status.enum';

@Injectable()
export class WhatsappConversationRepository extends BaseRepository<WhatsappConversation> {
  constructor(
    @InjectRepository(WhatsappConversation)
    repository: Repository<WhatsappConversation>,
  ) {
    super(repository);
  }

  async findActiveByPhoneNumber(
    phoneNumber: string,
  ): Promise<WhatsappConversation | null> {
    return this.repository.findOne({
      where: {
        phoneNumber,
        status: ConversationStatus.ACTIVE,
      },
      relations: ['messages', 'contact'],
      order: { messages: { createdAt: 'ASC' } },
    });
  }

  async findByIdWithMessages(id: string): Promise<WhatsappConversation | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['messages', 'contact'],
      order: { messages: { createdAt: 'ASC' } },
    });
  }

  async findActiveByContactId(
    contactId: string,
  ): Promise<WhatsappConversation | null> {
    return this.repository.findOne({
      where: {
        contactId,
        status: ConversationStatus.ACTIVE,
      },
    });
  }
}
