import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { WhatsappConversation } from './whatsapp-conversation.entity';
import { MessageSender } from '../enums/message-sender.enum';

@Entity()
export class WhatsappMessage extends BaseEntity {
  @Column()
  conversationId: string;

  @ManyToOne(() => WhatsappConversation, (conv) => conv.messages)
  @JoinColumn({ name: 'conversationId' })
  conversation: WhatsappConversation;

  @Column({ type: 'enum', enum: MessageSender })
  sender: MessageSender;

  @Column({ type: 'text' })
  content: string;
}
