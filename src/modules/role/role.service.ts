import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RESOURCE_MESSAGES } from '../../shared/constants/exception-messages';
import { PaginationQueryDto } from '../../shared/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../shared/dto/paginated-response.dto';
import { PermissionRepository } from '../permission/repositories/permission.repository';
import { RoleRepository } from './repositories/role.repository';
import { Role } from './entities/role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Permission } from '../permission/entities/permission.entity';

@Injectable()
export class RoleService {
  constructor(
    private readonly roleRepository: RoleRepository,
    private readonly permissionRepository: PermissionRepository,
  ) {}

  findAll(query: PaginationQueryDto): Promise<PaginatedResponseDto<Role>> {
    return this.roleRepository.findAll(query);
  }

  findById(id: string): Promise<Role> {
    return this.roleRepository.findById(id);
  }

  async create(data: CreateRoleDto): Promise<Role> {
    await this.ensureNameIsUnique(data.name);

    const permissions = await this.resolvePermissions(data.permissionIds);

    return this.roleRepository.create({
      name: data.name,
      description: data.description,
      isActive: data.isActive,
      permissions,
    });
  }

  async update(id: string, data: UpdateRoleDto): Promise<Role> {
    if (data.name) {
      await this.ensureNameIsUnique(data.name, id);
    }

    const role = await this.roleRepository.findById(id);

    if (data.permissionIds) {
      role.permissions = await this.resolvePermissions(data.permissionIds);
    }

    if (data.name !== undefined) {
      role.name = data.name;
    }

    if (data.description !== undefined) {
      role.description = data.description;
    }

    if (data.isActive !== undefined) {
      role.isActive = data.isActive;
    }

    return this.roleRepository.create(role);
  }

  remove(id: string): Promise<void> {
    return this.roleRepository.remove(id);
  }

  private async ensureNameIsUnique(
    name: string,
    excludeId?: string,
  ): Promise<void> {
    const existing = await this.roleRepository.findByName(name);

    if (existing && existing.id !== excludeId) {
      throw new ConflictException(RESOURCE_MESSAGES.ALREADY_EXISTS('name'));
    }
  }

  private async resolvePermissions(
    permissionIds: string[],
  ): Promise<Permission[]> {
    const permissions =
      await this.permissionRepository.findAllWithoutPagination();

    const permissionMap = new Map(permissions.map((p) => [p.id, p]));

    const resolved: Permission[] = [];

    for (const id of permissionIds) {
      const permission = permissionMap.get(id);

      if (!permission) {
        throw new NotFoundException(RESOURCE_MESSAGES.NOT_FOUND(id));
      }

      resolved.push(permission);
    }

    return resolved;
  }
}
