import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageModule } from '../storage/storage.module';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { InvoiceRepository } from './repository/invoice.repository';
import { Invoice } from './repository/invoice.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Invoice]), StorageModule],
  providers: [InvoiceService, InvoiceRepository],
  controllers: [InvoiceController],
})
export class InvoiceModule {}
