import { Injectable } from '@nestjs/common';
import { DeepPartial } from 'typeorm';
import { PaginationQueryDto } from '../../shared/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../shared/dto/paginated-response.dto';
import { ContactRepository } from './repositories/contact.repository';
import { Contact } from './entities/contact.entity';

@Injectable()
export class ContactService {
  constructor(private readonly contactRepository: ContactRepository) {}

  findAll(query: PaginationQueryDto): Promise<PaginatedResponseDto<Contact>> {
    return this.contactRepository.findAll(query);
  }

  findById(id: string): Promise<Contact> {
    return this.contactRepository.findById(id);
  }

  create(data: DeepPartial<Contact>): Promise<Contact> {
    return this.contactRepository.create(data);
  }

  update(id: string, data: DeepPartial<Contact>): Promise<Contact> {
    return this.contactRepository.update(id, data);
  }

  remove(id: string): Promise<void> {
    return this.contactRepository.remove(id);
  }
}
