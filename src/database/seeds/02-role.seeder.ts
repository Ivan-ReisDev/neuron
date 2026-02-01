import { DataSource } from 'typeorm';
import { Role } from '../../modules/role/entities/role.entity';
import { Permission } from '../../modules/permission/entities/permission.entity';
import { Resource } from '../../modules/permission/enums/resource.enum';
import { Action } from '../../modules/permission/enums/action.enum';

export default class RoleSeeder {
  async run(dataSource: DataSource): Promise<void> {
    const roleRepository = dataSource.getRepository(Role);
    const permissionRepository = dataSource.getRepository(Permission);

    const allPermissions = await permissionRepository.find();

    const contactReadPermission = allPermissions.find(
      (p) => p.resource === Resource.CONTACTS && p.action === Action.READ,
    );

    const adminRole = roleRepository.create({
      name: 'ADMIN',
      description: 'Administrador com acesso total ao sistema',
      isActive: true,
      permissions: allPermissions,
    });

    const userRole = roleRepository.create({
      name: 'USER',
      description: 'Usuário padrão com permissões limitadas',
      isActive: true,
      permissions: contactReadPermission ? [contactReadPermission] : [],
    });

    const existingAdmin = await roleRepository.findOne({
      where: { name: 'ADMIN' },
    });

    if (existingAdmin) {
      existingAdmin.permissions = allPermissions;
      await roleRepository.save(existingAdmin);
    } else {
      await roleRepository.save(adminRole);
    }

    const existingUser = await roleRepository.findOne({
      where: { name: 'USER' },
    });

    if (existingUser) {
      existingUser.permissions = contactReadPermission
        ? [contactReadPermission]
        : [];
      await roleRepository.save(existingUser);
    } else {
      await roleRepository.save(userRole);
    }
  }
}
