import { Injectable } from '@nestjs/common';
import { PaginationQueryDto } from '../../shared/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../shared/dto/paginated-response.dto';
import { PermissionRepository } from './repositories/permission.repository';
import { Permission } from './entities/permission.entity';

@Injectable()
export class PermissionService {
  constructor(private readonly permissionRepository: PermissionRepository) {}

  findAll(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<Permission>> {
    return this.permissionRepository.findAll(query);
  }

  findById(id: string): Promise<Permission> {
    return this.permissionRepository.findById(id);
  }
}
