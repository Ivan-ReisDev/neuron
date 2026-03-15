import { ForbiddenException, Injectable } from '@nestjs/common';
import { DeepPartial } from 'typeorm';
import { AUTH_MESSAGES } from '../../shared/constants/exception-messages';
import { PaginationQueryDto } from '../../shared/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../shared/dto/paginated-response.dto';
import { JwtPayload } from '../auth/types/jwt-payload';
import { StorageService } from '../storage/storage.service';
import { InvoiceRepository } from './repository/invoice.repository';
import { Invoice } from './repository/invoice.entity';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

const ADMIN_ROLE = 'ADMIN';

@Injectable()
export class InvoiceService {
  constructor(
    private readonly invoiceRepository: InvoiceRepository,
    private readonly storageService: StorageService,
  ) {}

  async create(data: CreateInvoiceDto): Promise<Invoice> {
    const invoiceData: DeepPartial<Invoice> = {
      description: data.description,
      amount: data.amount,
      dueDate: new Date(data.dueDate),
      userId: data.userId,
    };

    return this.invoiceRepository.create(invoiceData);
  }

  async findAll(
    currentUser: JwtPayload,
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<Invoice>> {
    let result: PaginatedResponseDto<Invoice>;

    if (currentUser.role === ADMIN_ROLE) {
      result = await this.invoiceRepository.findAll(query);
    } else {
      result = await this.invoiceRepository.findAllByUserId(
        currentUser.sub,
        query,
      );
    }

    result.data = result.data.map((invoice) =>
      this.applyVisibility(invoice, currentUser),
    );

    return result;
  }

  async findById(currentUser: JwtPayload, id: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findById(id);
    this.ensureOwnershipOrAdmin(currentUser, invoice);
    return this.applyVisibility(invoice, currentUser);
  }

  async update(id: string, data: UpdateInvoiceDto): Promise<Invoice> {
    const updateData: DeepPartial<Invoice> = {};

    if (data.description !== undefined) updateData.description = data.description;
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.dueDate !== undefined) updateData.dueDate = new Date(data.dueDate);
    if (data.userId !== undefined) updateData.userId = data.userId;
    if (data.paidAt !== undefined) updateData.paidAt = new Date(data.paidAt);

    return this.invoiceRepository.update(id, updateData);
  }

  async uploadNotaFiscal(
    id: string,
    file: Express.Multer.File,
    userId: string,
  ): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findById(id);

    if (invoice.notaFiscalId) {
      await this.storageService.delete(invoice.notaFiscalId);
    }

    const uploaded = await this.storageService.upload(
      file,
      userId,
      'invoices/notas-fiscais',
    );

    return this.invoiceRepository.update(id, { notaFiscalId: uploaded.id });
  }

  async uploadComprovante(
    id: string,
    file: Express.Multer.File,
    userId: string,
  ): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findById(id);

    if (invoice.comprovanteId) {
      await this.storageService.delete(invoice.comprovanteId);
    }

    const uploaded = await this.storageService.upload(
      file,
      userId,
      'invoices/comprovantes',
    );

    return this.invoiceRepository.update(id, { comprovanteId: uploaded.id });
  }

  async getNotaFiscalUrl(
    currentUser: JwtPayload,
    id: string,
  ): Promise<{ url: string; expiresIn: number }> {
    const invoice = await this.invoiceRepository.findById(id);
    this.ensureOwnershipOrAdmin(currentUser, invoice);

    if (!invoice.notaFiscalId) {
      throw new ForbiddenException('Nota fiscal não disponível');
    }

    return this.storageService.getSignedUrl(invoice.notaFiscalId);
  }

  async getComprovanteUrl(
    id: string,
  ): Promise<{ url: string; expiresIn: number }> {
    const invoice = await this.invoiceRepository.findById(id);

    if (!invoice.comprovanteId) {
      throw new ForbiddenException('Comprovante não disponível');
    }

    return this.storageService.getSignedUrl(invoice.comprovanteId);
  }

  async remove(id: string): Promise<void> {
    const invoice = await this.invoiceRepository.findById(id);

    if (invoice.notaFiscalId) {
      await this.storageService.delete(invoice.notaFiscalId);
    }
    if (invoice.comprovanteId) {
      await this.storageService.delete(invoice.comprovanteId);
    }

    await this.invoiceRepository.remove(id);
  }

  private ensureOwnershipOrAdmin(
    currentUser: JwtPayload,
    invoice: Invoice,
  ): void {
    if (currentUser.role === ADMIN_ROLE) return;

    if (invoice.userId !== currentUser.sub) {
      throw new ForbiddenException(AUTH_MESSAGES.FORBIDDEN);
    }
  }

  private applyVisibility(invoice: Invoice, currentUser: JwtPayload): Invoice {
    if (currentUser.role !== ADMIN_ROLE) {
      invoice.comprovante = null;
      invoice.comprovanteId = null;
    }
    return invoice;
  }
}
