import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
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

  async create(data: CreateInvoiceDto) {
    const invoiceData: DeepPartial<Invoice> = {
      description: data.description,
      amount: data.amount,
      dueDate: new Date(data.dueDate),
      userId: data.userId,
    };

    const invoice = await this.invoiceRepository.create(invoiceData);
    return this.sanitizeInvoiceAdmin(invoice);
  }

  async findAll(
    currentUser: JwtPayload,
    query: PaginationQueryDto,
  ) {
    let result: PaginatedResponseDto<Invoice>;

    if (currentUser.role === ADMIN_ROLE) {
      result = await this.invoiceRepository.findAll(query);
    } else {
      result = await this.invoiceRepository.findAllByUserId(
        currentUser.sub,
        query,
      );
    }

    return {
      data: result.data.map((invoice) =>
        this.sanitizeInvoice(invoice, currentUser),
      ),
      meta: result.meta,
    };
  }

  async findById(currentUser: JwtPayload, id: string) {
    const invoice = await this.invoiceRepository.findById(id);
    this.ensureOwnershipOrAdmin(currentUser, invoice);
    return this.sanitizeInvoice(invoice, currentUser);
  }

  async update(id: string, data: UpdateInvoiceDto) {
    const updateData: DeepPartial<Invoice> = {};

    if (data.description !== undefined) updateData.description = data.description;
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.dueDate !== undefined) updateData.dueDate = new Date(data.dueDate);
    if (data.userId !== undefined) updateData.userId = data.userId;
    if (data.paidAt !== undefined) updateData.paidAt = new Date(data.paidAt);

    const invoice = await this.invoiceRepository.update(id, updateData);
    return this.sanitizeInvoiceAdmin(invoice);
  }

  async uploadNotaFiscal(
    id: string,
    file: Express.Multer.File,
    userId: string,
  ) {
    const invoice = await this.invoiceRepository.findById(id);

    if (invoice.notaFiscalId) {
      await this.invoiceRepository.update(id, { notaFiscalId: null });
      await this.storageService.delete(invoice.notaFiscalId);
    }

    const uploaded = await this.storageService.upload(
      file,
      userId,
      'invoices/notas-fiscais',
    );

    const updated = await this.invoiceRepository.update(id, { notaFiscalId: uploaded.id });
    return this.sanitizeInvoiceAdmin(updated);
  }

  async uploadComprovante(
    id: string,
    file: Express.Multer.File,
    userId: string,
  ) {
    const invoice = await this.invoiceRepository.findById(id);

    const uploaded = await this.storageService.upload(
      file,
      userId,
      'invoices/comprovantes',
    );

    invoice.comprovantes = [...(invoice.comprovantes || []), uploaded];
    await this.invoiceRepository.save(invoice);

    const refreshed = await this.invoiceRepository.findById(id);
    return this.sanitizeInvoiceAdmin(refreshed);
  }

  async removeComprovante(id: string, fileId: string) {
    const invoice = await this.invoiceRepository.findById(id);

    const comprovante = (invoice.comprovantes || []).find(c => c.id === fileId);
    if (!comprovante) {
      throw new NotFoundException('Comprovante não encontrado nesta fatura');
    }

    invoice.comprovantes = invoice.comprovantes.filter(c => c.id !== fileId);
    await this.invoiceRepository.save(invoice);

    await this.storageService.delete(fileId);

    const refreshed = await this.invoiceRepository.findById(id);
    return this.sanitizeInvoiceAdmin(refreshed);
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
    fileId: string,
  ): Promise<{ url: string; expiresIn: number }> {
    const invoice = await this.invoiceRepository.findById(id);

    const comprovante = (invoice.comprovantes || []).find(c => c.id === fileId);
    if (!comprovante) {
      throw new NotFoundException('Comprovante não encontrado nesta fatura');
    }

    return this.storageService.getSignedUrl(fileId);
  }

  async remove(id: string): Promise<void> {
    const invoice = await this.invoiceRepository.findById(id);
    const { notaFiscalId } = invoice;
    const comprovanteIds = (invoice.comprovantes || []).map(c => c.id);

    // Limpar relações antes de deletar files
    if (notaFiscalId) {
      await this.invoiceRepository.update(id, { notaFiscalId: null });
    }
    if (comprovanteIds.length > 0) {
      invoice.comprovantes = [];
      await this.invoiceRepository.save(invoice);
    }

    // Deletar files do R2 + banco
    if (notaFiscalId) {
      await this.storageService.delete(notaFiscalId);
    }
    for (const comprovanteId of comprovanteIds) {
      await this.storageService.delete(comprovanteId);
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

  private sanitizeInvoiceAdmin(invoice: Invoice) {
    return this.sanitizeInvoice(invoice, { role: ADMIN_ROLE } as JwtPayload);
  }

  private sanitizeInvoice(invoice: Invoice, currentUser: JwtPayload) {
    const sanitized: Record<string, any> = {
      id: invoice.id,
      description: invoice.description,
      amount: invoice.amount,
      dueDate: invoice.dueDate,
      paidAt: invoice.paidAt,
      notaFiscalId: invoice.notaFiscalId,
      status: invoice.status,
      user: invoice.user
        ? { id: invoice.user.id, name: invoice.user.name, email: invoice.user.email }
        : null,
      userId: invoice.userId,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    };

    if (currentUser.role === ADMIN_ROLE) {
      sanitized.comprovantes = (invoice.comprovantes || []).map(c => c.id);
    }

    return sanitized;
  }
}
