import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../../../shared/repositories/base.repository';
import { Contact } from '../entities/contact.entity';

@Injectable()
export class ContactRepository extends BaseRepository<Contact> {
  constructor(
    @InjectRepository(Contact)
    repository: Repository<Contact>,
  ) {
    super(repository);
  }
}
