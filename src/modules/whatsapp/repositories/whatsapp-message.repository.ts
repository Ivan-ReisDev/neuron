import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../../../shared/repositories/base.repository';
import { WhatsappMessage } from '../entities/whatsapp-message.entity';

@Injectable()
export class WhatsappMessageRepository extends BaseRepository<WhatsappMessage> {
  constructor(
    @InjectRepository(WhatsappMessage)
    repository: Repository<WhatsappMessage>,
  ) {
    super(repository);
  }

  async findByConversationId(
    conversationId: string,
  ): Promise<WhatsappMessage[]> {
    return this.repository.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
    });
  }
}
