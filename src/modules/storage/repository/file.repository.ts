import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from 'src/shared/repositories/base.repository';
import { File } from './file.entity';

@Injectable()
export class FileRepository extends BaseRepository<File> {
  constructor(
    @InjectRepository(File)
    repository: Repository<File>,
  ) {
    super(repository);
  }
}
