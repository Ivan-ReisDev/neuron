import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AppModule } from './../src/app.module';
import { User } from './../src/modules/user/entities/user.entity';
import { Role } from './../src/modules/role/entities/role.entity';
import { truncateAllTables } from './helpers/database.helper';
import { seedPermissionsAndRoles, getAdminToken } from './helpers/auth.helper';

describe('Users (e2e)', () => {
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

  describe('POST /api/users', () => {
    it('should create a user with valid data', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Ivan Reis',
          email: 'ivan@email.com',
          password: 'Senha@123',
          roleId: userRole.id,
        })
        .expect(201);

      const body = response.body as Partial<User>;
      expect(body.id).toBeDefined();
      expect(body.name).toBe('Ivan Reis');
      expect(body.email).toBe('ivan@email.com');
      expect(body.roleId).toBe(userRole.id);
      expect(body.isActive).toBe(true);
      expect(body.createdAt).toBeDefined();
      expect(body).not.toHaveProperty('password');
    });

    it('should create a user with admin role', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Admin User',
          email: 'newadmin@email.com',
          password: 'Admin@123',
          roleId: adminRole.id,
        })
        .expect(201);

      const body = response.body as Partial<User>;
      expect(body.roleId).toBe(adminRole.id);
      expect(body).not.toHaveProperty('password');
    });

    it('should create a user with isActive false', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Inactive User',
          email: 'inactive@email.com',
          password: 'Senha@123',
          roleId: userRole.id,
          isActive: false,
        })
        .expect(201);

      const body = response.body as Partial<User>;
      expect(body.isActive).toBe(false);
    });

    it('should hash the password before saving', async () => {
      await request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Ivan Reis',
          email: 'ivan@email.com',
          password: 'Senha@123',
          roleId: userRole.id,
        })
        .expect(201);

      const repository = dataSource.getRepository(User);
      const user = await repository.findOne({
        where: { email: 'ivan@email.com' },
      });

      expect(user).toBeDefined();
      const isHashed = await bcrypt.compare('Senha@123', user!.password);
      expect(isHashed).toBe(true);
    });

    it('should return 400 when name is missing', () => {
      return request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'ivan@email.com',
          password: 'Senha@123',
          roleId: userRole.id,
        })
        .expect(400);
    });

    it('should return 400 when name is too short', () => {
      return request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Ab',
          email: 'ivan@email.com',
          password: 'Senha@123',
          roleId: userRole.id,
        })
        .expect(400);
    });

    it('should return 400 when email is invalid', () => {
      return request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Ivan Reis',
          email: 'email-invalido',
          password: 'Senha@123',
          roleId: userRole.id,
        })
        .expect(400);
    });

    it('should return 400 when password is missing', () => {
      return request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Ivan Reis',
          email: 'ivan@email.com',
          roleId: userRole.id,
        })
        .expect(400);
    });

    it('should return 400 when password is too short', () => {
      return request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Ivan Reis',
          email: 'ivan@email.com',
          password: '1234567',
          roleId: userRole.id,
        })
        .expect(400);
    });

    it('should return 400 when roleId is invalid', () => {
      return request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Ivan Reis',
          email: 'ivan@email.com',
          password: 'Senha@123',
          roleId: 'invalid-uuid',
        })
        .expect(400);
    });

    it('should return 409 when email already exists', async () => {
      const repository = dataSource.getRepository(User);
      await repository.save({
        name: 'Existing User',
        email: 'ivan@email.com',
        password: await bcrypt.hash('Senha@123', 10),
        roleId: userRole.id,
      });

      return request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Ivan Reis',
          email: 'ivan@email.com',
          password: 'Senha@123',
          roleId: userRole.id,
        })
        .expect(409);
    });

    it('should return 401 without token', () => {
      return request(app.getHttpServer())
        .post('/api/users')
        .send({
          name: 'Ivan Reis',
          email: 'ivan@email.com',
          password: 'Senha@123',
          roleId: userRole.id,
        })
        .expect(401);
    });
  });

  describe('GET /api/users', () => {
    beforeEach(async () => {
      const repository = dataSource.getRepository(User);
      const password = await bcrypt.hash('Senha@123', 10);
      await repository.save([
        {
          name: 'User 1',
          email: 'u1@email.com',
          password,
          roleId: userRole.id,
        },
        {
          name: 'User 2',
          email: 'u2@email.com',
          password,
          roleId: adminRole.id,
        },
        {
          name: 'User 3',
          email: 'u3@email.com',
          password,
          roleId: userRole.id,
          isActive: false,
        },
      ]);
    });

    it('should return paginated users without password', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = response.body as {
        data: Partial<User>[];
        meta: {
          totalItems: number;
          page: number;
          hasPreviousPage: boolean;
          hasNextPage: boolean;
        };
      };
      expect(body.data.length).toBeGreaterThanOrEqual(3);
      expect(body.meta.page).toBe(1);

      for (const user of body.data) {
        expect(user).not.toHaveProperty('password');
      }
    });

    it('should respect pagination params', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/users?page=1&limit=2')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = response.body as {
        data: Partial<User>[];
        meta: {
          totalItems: number;
          totalPages: number;
          hasNextPage: boolean;
        };
      };
      expect(body.data).toHaveLength(2);
      expect(body.meta.hasNextPage).toBe(true);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return a user by id without password', async () => {
      const repository = dataSource.getRepository(User);
      const user = await repository.save({
        name: 'Ivan Reis',
        email: 'ivan@email.com',
        password: await bcrypt.hash('Senha@123', 10),
        roleId: userRole.id,
      });

      const response = await request(app.getHttpServer())
        .get(`/api/users/${user.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = response.body as Partial<User>;
      expect(body.id).toBe(user.id);
      expect(body.name).toBe('Ivan Reis');
      expect(body.email).toBe('ivan@email.com');
      expect(body).not.toHaveProperty('password');
    });

    it('should return 404 for non-existent id', () => {
      return request(app.getHttpServer())
        .get('/api/users/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should return 400 for invalid uuid', () => {
      return request(app.getHttpServer())
        .get('/api/users/invalid-uuid')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });
  });

  describe('PATCH /api/users/:id', () => {
    it('should update a user partially', async () => {
      const repository = dataSource.getRepository(User);
      const user = await repository.save({
        name: 'Nome Original',
        email: 'original@email.com',
        password: await bcrypt.hash('Senha@123', 10),
        roleId: userRole.id,
      });

      const response = await request(app.getHttpServer())
        .patch(`/api/users/${user.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Nome Atualizado' })
        .expect(200);

      const body = response.body as Partial<User>;
      expect(body.name).toBe('Nome Atualizado');
      expect(body.email).toBe('original@email.com');
      expect(body).not.toHaveProperty('password');
    });

    it('should hash the new password on update', async () => {
      const repository = dataSource.getRepository(User);
      const user = await repository.save({
        name: 'Ivan Reis',
        email: 'ivan@email.com',
        password: await bcrypt.hash('Senha@123', 10),
        roleId: userRole.id,
      });

      await request(app.getHttpServer())
        .patch(`/api/users/${user.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ password: 'NovaSenha@1' })
        .expect(200);

      const updated = await repository.findOne({ where: { id: user.id } });
      const isNewPassword = await bcrypt.compare(
        'NovaSenha@1',
        updated!.password,
      );
      expect(isNewPassword).toBe(true);
    });

    it('should return 409 when updating to an existing email', async () => {
      const repository = dataSource.getRepository(User);
      const password = await bcrypt.hash('Senha@123', 10);
      await repository.save({
        name: 'User Existente',
        email: 'existente@email.com',
        password,
        roleId: userRole.id,
      });
      const user = await repository.save({
        name: 'Outro User',
        email: 'outro@email.com',
        password,
        roleId: userRole.id,
      });

      return request(app.getHttpServer())
        .patch(`/api/users/${user.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'existente@email.com' })
        .expect(409);
    });

    it('should return 404 for non-existent id', () => {
      return request(app.getHttpServer())
        .patch('/api/users/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Teste' })
        .expect(404);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete a user', async () => {
      const repository = dataSource.getRepository(User);
      const user = await repository.save({
        name: 'Para Remover',
        email: 'remover@email.com',
        password: await bcrypt.hash('Senha@123', 10),
        roleId: userRole.id,
      });

      return request(app.getHttpServer())
        .delete(`/api/users/${user.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);
    });

    it('should return 404 for non-existent id', () => {
      return request(app.getHttpServer())
        .delete('/api/users/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});
