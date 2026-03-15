import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageService } from './storage.service';
import { StorageController } from './storage.controller';
import { FileRepository } from './repository/file.repository';
import { CompressionService } from './services/compression.service';
import { R2Provider } from './providers/r2.provider';
import { File } from './repository/file.entity';

@Module({
  imports: [TypeOrmModule.forFeature([File])],
  providers: [R2Provider, StorageService, CompressionService, FileRepository],
  controllers: [StorageController],
  exports: [StorageService],
})
export class StorageModule {}
