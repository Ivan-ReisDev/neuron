import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AppModule } from './../src/app.module';
import { User } from './../src/modules/user/entities/user.entity';
import { SidebarResponseItem } from './../src/modules/menu/types/sidebar-item';
import { PageAccessResponse } from './../src/modules/menu/types/page-access-response';
import { truncateAllTables } from './helpers/database.helper';
import { seedPermissionsAndRoles, getAdminToken } from './helpers/auth.helper';

const SALT_ROUNDS = 10;
const TOTAL_SIDEBAR_ITEMS = 6;
const USER_SIDEBAR_ITEMS = 2;

describe('Menu (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let adminToken: string;
  let userToken: string;

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

    const { userRole } = await seedPermissionsAndRoles(dataSource);

    const userRepository = dataSource.getRepository(User);
    await userRepository.save({
      name: 'Test User',
      email: 'user@test.com',
      password: await bcrypt.hash('User@123', SALT_ROUNDS),
      roleId: userRole.id,
      isActive: true,
    });

    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'user@test.com', password: 'User@123' });

    userToken = (loginResponse.body as { accessToken: string }).accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/menu/sidebar', () => {
    it('should return all sidebar items for ADMIN', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/menu/sidebar')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = response.body as SidebarResponseItem[];
      expect(body).toHaveLength(TOTAL_SIDEBAR_ITEMS);

      const slugs = body.map((item) => item.slug);
      expect(slugs).toContain('dashboard');
      expect(slugs).toContain('tickets');
      expect(slugs).toContain('contacts');
      expect(slugs).toContain('users');
      expect(slugs).toContain('roles');
      expect(slugs).toContain('permissions');
    });

    it('should return only Dashboard and Tickets for USER', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/menu/sidebar')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const body = response.body as SidebarResponseItem[];
      expect(body).toHaveLength(USER_SIDEBAR_ITEMS);

      const slugs = body.map((item) => item.slug);
      expect(slugs).toContain('dashboard');
      expect(slugs).toContain('tickets');
      expect(slugs).not.toContain('contacts');
      expect(slugs).not.toContain('users');
      expect(slugs).not.toContain('roles');
      expect(slugs).not.toContain('permissions');
    });

    it('should not include requiredPermission in response items', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/menu/sidebar')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = response.body as Record<string, unknown>[];
      body.forEach((item) => {
        expect(item).toHaveProperty('label');
        expect(item).toHaveProperty('slug');
        expect(item).toHaveProperty('icon');
        expect(item).not.toHaveProperty('requiredPermission');
      });
    });

    it('should return 401 without token', () => {
      return request(app.getHttpServer()).get('/api/menu/sidebar').expect(401);
    });
  });

  describe('GET /api/menu/pages/:slug/access', () => {
    it('should return hasAccess true for dashboard as any authenticated user', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/menu/pages/dashboard/access')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const body = response.body as PageAccessResponse;
      expect(body.hasAccess).toBe(true);
    });

    it('should return hasAccess true for tickets as USER', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/menu/pages/tickets/access')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const body = response.body as PageAccessResponse;
      expect(body.hasAccess).toBe(true);
    });

    it('should return hasAccess false for contacts as USER', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/menu/pages/contacts/access')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const body = response.body as PageAccessResponse;
      expect(body.hasAccess).toBe(false);
    });

    it('should return hasAccess false for users as USER', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/menu/pages/users/access')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const body = response.body as PageAccessResponse;
      expect(body.hasAccess).toBe(false);
    });

    it('should return hasAccess true for users as ADMIN', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/menu/pages/users/access')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = response.body as PageAccessResponse;
      expect(body.hasAccess).toBe(true);
    });

    it('should return hasAccess true for all pages as ADMIN', async () => {
      const slugs = [
        'dashboard',
        'tickets',
        'contacts',
        'users',
        'roles',
        'permissions',
      ];

      for (const slug of slugs) {
        const response = await request(app.getHttpServer())
          .get(`/api/menu/pages/${slug}/access`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        const body = response.body as PageAccessResponse;
        expect(body.hasAccess).toBe(true);
      }
    });

    it('should return hasAccess false for non-existent slug', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/menu/pages/slug-inexistente/access')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = response.body as PageAccessResponse;
      expect(body.hasAccess).toBe(false);
    });

    it('should return 401 without token', () => {
      return request(app.getHttpServer())
        .get('/api/menu/pages/dashboard/access')
        .expect(401);
    });
  });
});
