import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from './../src/app.module';
import { User } from './../src/modules/user/entities/user.entity';
import { UserRole } from './../src/modules/user/enums/user-role.enum';
import * as bcrypt from 'bcrypt';

describe('Users (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

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
    const entities = dataSource.entityMetadatas;
    const tableNames = entities
      .map((entity) => `"${entity.tableName}"`)
      .join(', ');
    await dataSource.query(
      `TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE`,
    );
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/users', () => {
    it('should create a user with valid data', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/users')
        .send({
          name: 'Ivan Reis',
          email: 'ivan@email.com',
          password: 'Senha@123',
        })
        .expect(201);

      const body = response.body as Partial<User>;
      expect(body.id).toBeDefined();
      expect(body.name).toBe('Ivan Reis');
      expect(body.email).toBe('ivan@email.com');
      expect(body.role).toBe(UserRole.USER);
      expect(body.isActive).toBe(true);
      expect(body.createdAt).toBeDefined();
      expect(body).not.toHaveProperty('password');
    });

    it('should create a user with admin role', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/users')
        .send({
          name: 'Admin User',
          email: 'admin@email.com',
          password: 'Admin@123',
          role: UserRole.ADMIN,
        })
        .expect(201);

      const body = response.body as Partial<User>;
      expect(body.role).toBe(UserRole.ADMIN);
      expect(body).not.toHaveProperty('password');
    });

    it('should create a user with isActive false', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/users')
        .send({
          name: 'Inactive User',
          email: 'inactive@email.com',
          password: 'Senha@123',
          isActive: false,
        })
        .expect(201);

      const body = response.body as Partial<User>;
      expect(body.isActive).toBe(false);
    });

    it('should hash the password before saving', async () => {
      await request(app.getHttpServer())
        .post('/api/users')
        .send({
          name: 'Ivan Reis',
          email: 'ivan@email.com',
          password: 'Senha@123',
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
        .send({
          email: 'ivan@email.com',
          password: 'Senha@123',
        })
        .expect(400);
    });

    it('should return 400 when name is too short', () => {
      return request(app.getHttpServer())
        .post('/api/users')
        .send({
          name: 'Ab',
          email: 'ivan@email.com',
          password: 'Senha@123',
        })
        .expect(400);
    });

    it('should return 400 when email is invalid', () => {
      return request(app.getHttpServer())
        .post('/api/users')
        .send({
          name: 'Ivan Reis',
          email: 'email-invalido',
          password: 'Senha@123',
        })
        .expect(400);
    });

    it('should return 400 when password is missing', () => {
      return request(app.getHttpServer())
        .post('/api/users')
        .send({
          name: 'Ivan Reis',
          email: 'ivan@email.com',
        })
        .expect(400);
    });

    it('should return 400 when password is too short', () => {
      return request(app.getHttpServer())
        .post('/api/users')
        .send({
          name: 'Ivan Reis',
          email: 'ivan@email.com',
          password: '1234567',
        })
        .expect(400);
    });

    it('should return 400 when role is invalid', () => {
      return request(app.getHttpServer())
        .post('/api/users')
        .send({
          name: 'Ivan Reis',
          email: 'ivan@email.com',
          password: 'Senha@123',
          role: 'INVALID',
        })
        .expect(400);
    });

    it('should return 409 when email already exists', async () => {
      const repository = dataSource.getRepository(User);
      await repository.save({
        name: 'Existing User',
        email: 'ivan@email.com',
        password: await bcrypt.hash('Senha@123', 10),
      });

      return request(app.getHttpServer())
        .post('/api/users')
        .send({
          name: 'Ivan Reis',
          email: 'ivan@email.com',
          password: 'Senha@123',
        })
        .expect(409);
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
          role: UserRole.USER,
        },
        {
          name: 'User 2',
          email: 'u2@email.com',
          password,
          role: UserRole.ADMIN,
        },
        {
          name: 'User 3',
          email: 'u3@email.com',
          password,
          isActive: false,
        },
      ]);
    });

    it('should return paginated users without password', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/users')
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
      expect(body.data).toHaveLength(3);
      expect(body.meta.totalItems).toBe(3);
      expect(body.meta.page).toBe(1);

      for (const user of body.data) {
        expect(user).not.toHaveProperty('password');
      }
    });

    it('should respect pagination params', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/users?page=1&limit=2')
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
      expect(body.meta.totalItems).toBe(3);
      expect(body.meta.totalPages).toBe(2);
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
      });

      const response = await request(app.getHttpServer())
        .get(`/api/users/${user.id}`)
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
        .expect(404);
    });

    it('should return 400 for invalid uuid', () => {
      return request(app.getHttpServer())
        .get('/api/users/invalid-uuid')
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
      });

      const response = await request(app.getHttpServer())
        .patch(`/api/users/${user.id}`)
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
      });

      await request(app.getHttpServer())
        .patch(`/api/users/${user.id}`)
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
      });
      const user = await repository.save({
        name: 'Outro User',
        email: 'outro@email.com',
        password,
      });

      return request(app.getHttpServer())
        .patch(`/api/users/${user.id}`)
        .send({ email: 'existente@email.com' })
        .expect(409);
    });

    it('should return 404 for non-existent id', () => {
      return request(app.getHttpServer())
        .patch('/api/users/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d')
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
      });

      return request(app.getHttpServer())
        .delete(`/api/users/${user.id}`)
        .expect(204);
    });

    it('should return 404 for non-existent id', () => {
      return request(app.getHttpServer())
        .delete('/api/users/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d')
        .expect(404);
    });
  });
});
