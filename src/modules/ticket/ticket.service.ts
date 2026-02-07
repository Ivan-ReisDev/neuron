import { ForbiddenException, Injectable } from '@nestjs/common';
import { DeepPartial } from 'typeorm';
import { AUTH_MESSAGES } from '../../shared/constants/exception-messages';
import { PaginationQueryDto } from '../../shared/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../shared/dto/paginated-response.dto';
import { JwtPayload } from '../auth/types/jwt-payload';
import { TicketRepository } from './repositories/ticket.repository';
import { Ticket } from './entities/ticket.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';

const ADMIN_ROLE = 'ADMIN';

@Injectable()
export class TicketService {
  constructor(private readonly ticketRepository: TicketRepository) {}

  findAll(
    currentUser: JwtPayload,
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<Ticket>> {
    if (currentUser.role === ADMIN_ROLE) {
      return this.ticketRepository.findAll(query);
    }

    return this.ticketRepository.findAllByUserId(currentUser.sub, query);
  }

  async findById(currentUser: JwtPayload, id: string): Promise<Ticket> {
    const ticket = await this.ticketRepository.findById(id);

    this.ensureOwnershipOrAdmin(currentUser, ticket);

    return ticket;
  }

  create(currentUser: JwtPayload, data: CreateTicketDto): Promise<Ticket> {
    const ticketData: DeepPartial<Ticket> = {
      ...data,
      userId: currentUser.sub,
    };

    return this.ticketRepository.create(ticketData);
  }

  update(id: string, data: UpdateTicketDto): Promise<Ticket> {
    return this.ticketRepository.update(id, data);
  }

  remove(id: string): Promise<void> {
    return this.ticketRepository.remove(id);
  }

  private ensureOwnershipOrAdmin(
    currentUser: JwtPayload,
    ticket: Ticket,
  ): void {
    if (currentUser.role === ADMIN_ROLE) {
      return;
    }

    if (ticket.userId !== currentUser.sub) {
      throw new ForbiddenException(AUTH_MESSAGES.FORBIDDEN);
    }
  }
}
