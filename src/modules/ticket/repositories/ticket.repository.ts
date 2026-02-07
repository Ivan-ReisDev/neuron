import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsOrder, Repository } from 'typeorm';
import { BaseRepository } from '../../../shared/repositories/base.repository';
import { PaginationQueryDto } from '../../../shared/dto/pagination-query.dto';
import {
  PaginatedResponseDto,
  PaginationMeta,
} from '../../../shared/dto/paginated-response.dto';
import { Ticket } from '../entities/ticket.entity';

@Injectable()
export class TicketRepository extends BaseRepository<Ticket> {
  constructor(
    @InjectRepository(Ticket)
    repository: Repository<Ticket>,
  ) {
    super(repository);
  }

  async findAllByUserId(
    userId: string,
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<Ticket>> {
    const { page = 1, limit = 10, sort = 'createdAt', order = 'DESC' } = query;
    const skip = (page - 1) * limit;

    const orderOption = { [sort]: order } as FindOptionsOrder<Ticket>;

    const [data, totalItems] = await this.repository.findAndCount({
      where: { userId },
      order: orderOption,
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(totalItems / limit);

    const meta: PaginationMeta = {
      page,
      limit,
      totalItems,
      totalPages,
      hasPreviousPage: page > 1,
      hasNextPage: page < totalPages,
    };

    return new PaginatedResponseDto(data, meta);
  }
}
