import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { User } from '../../user/entities/user.entity';
import { File } from '../../storage/repository/file.entity';
import { InvoiceStatus } from '../enums/invoice-status.enum';

@Entity()
export class Invoice extends BaseEntity {
  @Column({ length: 255 })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'date' })
  dueDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date | null;

  @ManyToOne(() => File, { nullable: true, eager: true })
  @JoinColumn({ name: 'notaFiscalId' })
  notaFiscal: File | null;

  @Column({ nullable: true })
  notaFiscalId: string | null;

  @ManyToOne(() => File, { nullable: true, eager: true })
  @JoinColumn({ name: 'comprovanteId' })
  comprovante: File | null;

  @Column({ nullable: true })
  comprovanteId: string | null;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  get status(): InvoiceStatus {
    if (this.paidAt) return InvoiceStatus.PAID;
    if (new Date(this.dueDate) < new Date()) return InvoiceStatus.OVERDUE;
    return InvoiceStatus.PENDING;
  }
}
