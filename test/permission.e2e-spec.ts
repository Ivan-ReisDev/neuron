import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AppModule } from './../src/app.module';
import { Permission } from './../src/modules/permission/entities/permission.entity';
import { User } from './../src/modules/user/entities/user.entity';
import { truncateAllTables } from './helpers/database.helper';
import { seedPermissionsAndRoles, getAdminToken } from './helpers/auth.helper';

describe('Permissions (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let adminToken: string;

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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/permissions', () => {
    it('should return paginated permissions', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/permissions')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = response.body as {
        data: Permission[];
        meta: { totalItems: number; page: number };
      };
      expect(body.data.length).toBeGreaterThan(0);
      expect(body.meta.page).toBe(1);
      expect(body.meta.totalItems).toBeGreaterThanOrEqual(16);
    });

    it('should support pagination parameters', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/permissions?page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = response.body as {
        data: Permission[];
        meta: { totalItems: number; page: number; limit: number };
      };
      expect(body.data).toHaveLength(5);
      expect(body.meta.limit).toBe(5);
    });

    it('should return 401 without token', () => {
      return request(app.getHttpServer()).get('/api/permissions').expect(401);
    });

    it('should return 403 for user without permission', async () => {
      const { userRole } = await seedPermissionsAndRoles(dataSource);

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
        .get('/api/permissions')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('GET /api/permissions/:id', () => {
    it('should return a permission by id', async () => {
      const permissions = await dataSource.getRepository(Permission).find();
      const permission = permissions[0];

      const response = await request(app.getHttpServer())
        .get(`/api/permissions/${permission.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = response.body as Permission;
      expect(body.id).toBe(permission.id);
      expect(body.resource).toBe(permission.resource);
      expect(body.action).toBe(permission.action);
    });

    it('should return 404 for non-existent id', () => {
      return request(app.getHttpServer())
        .get('/api/permissions/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should return 400 for invalid uuid', () => {
      return request(app.getHttpServer())
        .get('/api/permissions/invalid-uuid')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });
  });
});
