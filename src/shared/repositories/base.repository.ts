import { NotFoundException } from '@nestjs/common';
import {
  DeepPartial,
  FindOptionsOrder,
  FindOptionsWhere,
  Repository,
} from 'typeorm';
import { BaseEntity } from '../entities/base.entity';
import { RESOURCE_MESSAGES } from '../constants/exception-messages';
import { PaginationQueryDto } from '../dto/pagination-query.dto';
import {
  PaginatedResponseDto,
  PaginationMeta,
} from '../dto/paginated-response.dto';

export abstract class BaseRepository<T extends BaseEntity> {
  constructor(protected readonly repository: Repository<T>) {}

  async findAll(query: PaginationQueryDto): Promise<PaginatedResponseDto<T>> {
    const { page = 1, limit = 10, sort = 'createdAt', order = 'DESC' } = query;
    const skip = (page - 1) * limit;

    const orderOption = { [sort]: order } as FindOptionsOrder<T>;

    const [data, totalItems] = await this.repository.findAndCount({
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

  async findById(id: string): Promise<T> {
    const where = { id } as FindOptionsWhere<T>;
    const entity = await this.repository.findOne({ where });

    if (!entity) {
      throw new NotFoundException(RESOURCE_MESSAGES.NOT_FOUND(id));
    }

    return entity;
  }

  async create(data: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async update(id: string, data: DeepPartial<T>): Promise<T> {
    const entity = await this.findById(id);
    const merged = this.repository.merge(entity, data);
    return this.repository.save(merged);
  }

  async remove(id: string): Promise<void> {
    const entity = await this.findById(id);
    await this.repository.remove(entity);
  }
}
