import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AppModule } from './../src/app.module';
import { Role } from './../src/modules/role/entities/role.entity';
import { Permission } from './../src/modules/permission/entities/permission.entity';
import { User } from './../src/modules/user/entities/user.entity';
import { truncateAllTables } from './helpers/database.helper';
import { seedPermissionsAndRoles, getAdminToken } from './helpers/auth.helper';

describe('Roles (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let adminToken: string;
  let adminRole: Role;
  let userRole: Role;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    dataSource = app.get(DataSource);
  });

  beforeEach(async () => {
    await truncateAllTables(dataSource);
    adminToken = await getAdminToken(app, dataSource);
    const roles = await seedPermissionsAndRoles(dataSource);
    adminRole = roles.adminRole;
    userRole = roles.userRole;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/roles', () => {
    it('should return paginated roles', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = response.body as {
        data: Role[];
        meta: { totalItems: number; page: number };
      };
      expect(body.data.length).toBeGreaterThanOrEqual(2);
      expect(body.meta.page).toBe(1);
    });

    it('should return 401 without token', () => {
      return request(app.getHttpServer()).get('/api/roles').expect(401);
    });

    it('should return 403 for user without permission', async () => {
      const userRepository = dataSource.getRepository(User);
      await userRepository.save({
        name: 'Regular User',
        email: 'regularuser@email.com',
        password: await bcrypt.hash('User@1234', 10),
        roleId: userRole.id,
        isActive: true,
      });

      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'regularuser@email.com', password: 'User@1234' });

      const userToken = (loginResponse.body as { accessToken: string })
        .accessToken;

      return request(app.getHttpServer())
        .get('/api/roles')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('GET /api/roles/:id', () => {
    it('should return a role by id with permissions', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/roles/${adminRole.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = response.body as Role;
      expect(body.id).toBe(adminRole.id);
      expect(body.name).toBe('ADMIN');
      expect(body.permissions).toBeDefined();
      expect(body.permissions.length).toBeGreaterThan(0);
    });

    it('should return 404 for non-existent id', () => {
      return request(app.getHttpServer())
        .get('/api/roles/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('POST /api/roles', () => {
    it('should create a new role', async () => {
      const permissions = await dataSource.getRepository(Permission).find();
      const permissionIds = permissions.slice(0, 3).map((p) => p.id);

      const response = await request(app.getHttpServer())
        .post('/api/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'EDITOR',
          description: 'Pode editar conteúdo',
          permissionIds,
        })
        .expect(201);

      const body = response.body as Role;
      expect(body.id).toBeDefined();
      expect(body.name).toBe('EDITOR');
      expect(body.description).toBe('Pode editar conteúdo');
      expect(body.permissions).toHaveLength(3);
    });

    it('should return 400 when name is missing', () => {
      return request(app.getHttpServer())
        .post('/api/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          description: 'Teste',
          permissionIds: [],
        })
        .expect(400);
    });

    it('should return 400 when permissionIds contains invalid uuid', () => {
      return request(app.getHttpServer())
        .post('/api/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'TEST',
          description: 'Teste',
          permissionIds: ['invalid-uuid'],
        })
        .expect(400);
    });

    it('should return 409 when name already exists', () => {
      return request(app.getHttpServer())
        .post('/api/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'ADMIN',
          description: 'Duplicata',
          permissionIds: [],
        })
        .expect(409);
    });
  });

  describe('PATCH /api/roles/:id', () => {
    it('should update a role partially', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/roles/${userRole.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ description: 'Descrição atualizada' })
        .expect(200);

      const body = response.body as Role;
      expect(body.description).toBe('Descrição atualizada');
      expect(body.name).toBe('USER');
    });

    it('should update role permissions', async () => {
      const permissions = await dataSource.getRepository(Permission).find();
      const newPermissionIds = permissions.slice(0, 5).map((p) => p.id);

      const response = await request(app.getHttpServer())
        .patch(`/api/roles/${userRole.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ permissionIds: newPermissionIds })
        .expect(200);

      const body = response.body as Role;
      expect(body.permissions).toHaveLength(5);
    });

    it('should return 404 for non-existent id', () => {
      return request(app.getHttpServer())
        .patch('/api/roles/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ description: 'Teste' })
        .expect(404);
    });

    it('should return 409 when updating to an existing name', () => {
      return request(app.getHttpServer())
        .patch(`/api/roles/${userRole.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'ADMIN' })
        .expect(409);
    });
  });

  describe('DELETE /api/roles/:id', () => {
    it('should delete a role', async () => {
      const permissions = await dataSource.getRepository(Permission).find();
      const createResponse = await request(app.getHttpServer())
        .post('/api/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'TEMP',
          description: 'Temporária',
          permissionIds: [permissions[0].id],
        });

      const roleId = (createResponse.body as Role).id;

      return request(app.getHttpServer())
        .delete(`/api/roles/${roleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);
    });

    it('should return 404 for non-existent id', () => {
      return request(app.getHttpServer())
        .delete('/api/roles/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});
