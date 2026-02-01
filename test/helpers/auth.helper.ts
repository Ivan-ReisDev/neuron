import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Role } from '../../src/modules/role/entities/role.entity';
import { User } from '../../src/modules/user/entities/user.entity';
import { Permission } from '../../src/modules/permission/entities/permission.entity';
import { Resource } from '../../src/modules/permission/enums/resource.enum';
import { Action } from '../../src/modules/permission/enums/action.enum';

const SALT_ROUNDS = 10;

export async function seedPermissionsAndRoles(
  dataSource: DataSource,
): Promise<{ adminRole: Role; userRole: Role }> {
  const permissionRepository = dataSource.getRepository(Permission);
  const roleRepository = dataSource.getRepository(Role);

  const permissions: Partial<Permission>[] = [];
  for (const resource of Object.values(Resource)) {
    for (const action of Object.values(Action)) {
      permissions.push({
        resource,
        action,
        description: `${action} ${resource}`,
      });
    }
  }

  await permissionRepository.upsert(permissions, ['resource', 'action']);
  const allPermissions = await permissionRepository.find();

  const contactReadPermission = allPermissions.find(
    (p) => p.resource === Resource.CONTACTS && p.action === Action.READ,
  );

  let adminRole = await roleRepository.findOne({ where: { name: 'ADMIN' } });
  if (!adminRole) {
    adminRole = await roleRepository.save(
      roleRepository.create({
        name: 'ADMIN',
        description: 'Administrador',
        isActive: true,
        permissions: allPermissions,
      }),
    );
  } else {
    adminRole.permissions = allPermissions;
    adminRole = await roleRepository.save(adminRole);
  }

  let userRole = await roleRepository.findOne({ where: { name: 'USER' } });
  if (!userRole) {
    userRole = await roleRepository.save(
      roleRepository.create({
        name: 'USER',
        description: 'Usuário padrão',
        isActive: true,
        permissions: contactReadPermission ? [contactReadPermission] : [],
      }),
    );
  } else {
    userRole.permissions = contactReadPermission ? [contactReadPermission] : [];
    userRole = await roleRepository.save(userRole);
  }

  return { adminRole, userRole };
}

export async function createTestAdmin(
  dataSource: DataSource,
  roleId: string,
): Promise<User> {
  const repository = dataSource.getRepository(User);
  return repository.save({
    name: 'Test Admin',
    email: 'admin@test.com',
    password: await bcrypt.hash('Admin@123', SALT_ROUNDS),
    roleId,
    isActive: true,
  });
}

export async function getAdminToken(
  app: INestApplication<App>,
  dataSource: DataSource,
): Promise<string> {
  const { adminRole } = await seedPermissionsAndRoles(dataSource);
  await createTestAdmin(dataSource, adminRole.id);

  const response = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email: 'admin@test.com', password: 'Admin@123' });

  const body = response.body as { accessToken: string };
  return body.accessToken;
}
