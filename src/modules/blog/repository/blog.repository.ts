import { BaseRepository } from 'src/shared/repositories/base.repository';
import { Blog } from './blog.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class BlogRepository extends BaseRepository<Blog> {
  constructor(
    @InjectRepository(Blog)
    repository: Repository<Blog>,
  ) {
    super(repository);
  }
}
