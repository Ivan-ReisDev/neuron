import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { Contact } from '../../contact/entities/contact.entity';
import { WhatsappMessage } from './whatsapp-message.entity';
import { ConversationStatus } from '../enums/conversation-status.enum';

@Entity()
export class WhatsappConversation extends BaseEntity {
  @Column()
  contactId: string;

  @ManyToOne(() => Contact, { eager: true })
  @JoinColumn({ name: 'contactId' })
  contact: Contact;

  @Column()
  phoneNumber: string;

  @Column({
    type: 'enum',
    enum: ConversationStatus,
    default: ConversationStatus.ACTIVE,
  })
  status: ConversationStatus;

  @Column({ type: 'text', nullable: true })
  summary: string | null;

  @Column({ type: 'timestamp', nullable: true })
  summarySentAt: Date | null;

  @OneToMany(() => WhatsappMessage, (message) => message.conversation, {
    cascade: true,
  })
  messages: WhatsappMessage[];
}
