import { ConflictException, Injectable } from '@nestjs/common';
import { DeepPartial } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { RESOURCE_MESSAGES } from '../../shared/constants/exception-messages';
import { PaginationQueryDto } from '../../shared/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../shared/dto/paginated-response.dto';
import { UserRepository } from './repositories/user.repository';
import { User } from './entities/user.entity';

const SALT_ROUNDS = 10;

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  findAll(query: PaginationQueryDto): Promise<PaginatedResponseDto<User>> {
    return this.userRepository.findAll(query);
  }

  findById(id: string): Promise<User> {
    return this.userRepository.findById(id);
  }

  async create(data: DeepPartial<User>): Promise<User> {
    await this.ensureEmailIsUnique(data.email as string);

    const hashedPassword = await bcrypt.hash(
      data.password as string,
      SALT_ROUNDS,
    );

    return this.userRepository.create({ ...data, password: hashedPassword });
  }

  async update(id: string, data: DeepPartial<User>): Promise<User> {
    if (data.email) {
      await this.ensureEmailIsUnique(data.email, id);
    }

    if (data.password) {
      data.password = await bcrypt.hash(data.password, SALT_ROUNDS);
    }

    return this.userRepository.update(id, data);
  }

  remove(id: string): Promise<void> {
    return this.userRepository.remove(id);
  }

  private async ensureEmailIsUnique(
    email: string,
    excludeId?: string,
  ): Promise<void> {
    const existing = await this.userRepository.findByEmail(email);

    if (existing && existing.id !== excludeId) {
      throw new ConflictException(RESOURCE_MESSAGES.ALREADY_EXISTS('email'));
    }
  }
}
