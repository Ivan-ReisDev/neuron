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
import {
  seedPermissionsAndRoles,
  createTestAdmin,
} from './helpers/auth.helper';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
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
    const roles = await seedPermissionsAndRoles(dataSource);
    adminRole = roles.adminRole;
    userRole = roles.userRole;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/auth/login', () => {
    it('should return accessToken with valid credentials', async () => {
      await createTestAdmin(dataSource, adminRole.id);

      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'admin@test.com', password: 'Admin@123' })
        .expect(200);

      const body = response.body as { accessToken: string };
      expect(body.accessToken).toBeDefined();
      expect(typeof body.accessToken).toBe('string');
    });

    it('should return 401 for non-existent email', async () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'inexistente@email.com', password: 'Senha@123' })
        .expect(401);
    });

    it('should return 401 for wrong password', async () => {
      await createTestAdmin(dataSource, adminRole.id);

      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'admin@test.com', password: 'SenhaErrada@1' })
        .expect(401);
    });

    it('should return 400 for invalid email format', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'email-invalido', password: 'Senha@123' })
        .expect(400);
    });

    it('should return 400 when password is missing', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'admin@test.com' })
        .expect(400);
    });
  });

  describe('Protected Routes', () => {
    it('should return 401 when accessing protected route without token', () => {
      return request(app.getHttpServer()).get('/api/users').expect(401);
    });

    it('should return 401 when accessing protected route with invalid token', () => {
      return request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should return 200 when accessing protected route with valid token', async () => {
      await createTestAdmin(dataSource, adminRole.id);

      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'admin@test.com', password: 'Admin@123' });

      const token = (loginResponse.body as { accessToken: string }).accessToken;

      return request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    it('should return 403 when user lacks required permission', async () => {
      const userRepository = dataSource.getRepository(User);
      await userRepository.save({
        name: 'Regular User',
        email: 'user@test.com',
        password: await bcrypt.hash('User@1234', 10),
        roleId: userRole.id,
        isActive: true,
      });

      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'user@test.com', password: 'User@1234' });

      const token = (loginResponse.body as { accessToken: string }).accessToken;

      return request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('should allow access to public routes without token', async () => {
      return request(app.getHttpServer()).get('/api/contacts').expect(200);
    });
  });
});
