import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsOrder, Repository } from 'typeorm';
import { BaseRepository } from 'src/shared/repositories/base.repository';
import { Invoice } from './invoice.entity';
import { PaginationQueryDto } from 'src/shared/dto/pagination-query.dto';
import {
  PaginatedResponseDto,
  PaginationMeta,
} from 'src/shared/dto/paginated-response.dto';

@Injectable()
export class InvoiceRepository extends BaseRepository<Invoice> {
  constructor(
    @InjectRepository(Invoice)
    repository: Repository<Invoice>,
  ) {
    super(repository);
  }

  async findAllByUserId(
    userId: string,
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<Invoice>> {
    const { page = 1, limit = 10, sort = 'createdAt', order = 'DESC' } = query;
    const skip = (page - 1) * limit;
    const orderOption = { [sort]: order } as FindOptionsOrder<Invoice>;

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
