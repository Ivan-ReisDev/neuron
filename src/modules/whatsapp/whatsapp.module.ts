import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WhatsappConversation } from './entities/whatsapp-conversation.entity';
import { WhatsappMessage } from './entities/whatsapp-message.entity';
import { WhatsappConversationRepository } from './repositories/whatsapp-conversation.repository';
import { WhatsappMessageRepository } from './repositories/whatsapp-message.repository';
import { WhatsappClientService } from './whatsapp-client.service';
import { WhatsappService } from './whatsapp.service';
import { WhatsappController } from './whatsapp.controller';

@Module({
  imports: [TypeOrmModule.forFeature([WhatsappConversation, WhatsappMessage])],
  controllers: [WhatsappController],
  providers: [
    WhatsappClientService,
    WhatsappConversationRepository,
    WhatsappMessageRepository,
    WhatsappService,
  ],
  exports: [WhatsappService],
})
export class WhatsappModule {}
