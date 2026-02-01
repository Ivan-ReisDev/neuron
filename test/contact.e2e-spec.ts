import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from './../src/app.module';
import { Contact } from './../src/modules/contact/entities/contact.entity';
import { truncateAllTables } from './helpers/database.helper';
import { getAdminToken } from './helpers/auth.helper';

describe('Contacts (e2e)', () => {
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

  describe('POST /api/contacts', () => {
    it('should create a contact with valid data (public)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/contacts')
        .send({
          name: 'Ivan Reis',
          email: 'ivan@email.com',
          description: 'Mensagem de teste.',
        })
        .expect(201);

      const body = response.body as Contact;
      expect(body.id).toBeDefined();
      expect(body.name).toBe('Ivan Reis');
      expect(body.email).toBe('ivan@email.com');
      expect(body.phone).toBeNull();
      expect(body.description).toBe('Mensagem de teste.');
      expect(body.createdAt).toBeDefined();
    });

    it('should create a contact with phone', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/contacts')
        .send({
          name: 'Maria Silva',
          email: 'maria@email.com',
          phone: '+55 11 99999-0001',
          description: 'Contato com telefone.',
        })
        .expect(201);

      const body = response.body as Contact;
      expect(body.phone).toBe('+55 11 99999-0001');
    });

    it('should return 400 when name is missing', () => {
      return request(app.getHttpServer())
        .post('/api/contacts')
        .send({
          email: 'ivan@email.com',
          description: 'Sem nome.',
        })
        .expect(400);
    });

    it('should return 400 when email is invalid', () => {
      return request(app.getHttpServer())
        .post('/api/contacts')
        .send({
          name: 'Ivan Reis',
          email: 'email-invalido',
          description: 'Email errado.',
        })
        .expect(400);
    });

    it('should return 400 when description is missing', () => {
      return request(app.getHttpServer())
        .post('/api/contacts')
        .send({
          name: 'Ivan Reis',
          email: 'ivan@email.com',
        })
        .expect(400);
    });
  });

  describe('GET /api/contacts', () => {
    beforeEach(async () => {
      const repository = dataSource.getRepository(Contact);
      await repository.save([
        {
          name: 'Contato 1',
          email: 'c1@email.com',
          description: 'Desc 1',
        },
        {
          name: 'Contato 2',
          email: 'c2@email.com',
          description: 'Desc 2',
        },
        {
          name: 'Contato 3',
          email: 'c3@email.com',
          description: 'Desc 3',
        },
      ]);
    });

    it('should return paginated contacts (public)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/contacts')
        .expect(200);

      const body = response.body as {
        data: Contact[];
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
      expect(body.meta.hasPreviousPage).toBe(false);
      expect(body.meta.hasNextPage).toBe(false);
    });

    it('should respect pagination params', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/contacts?page=1&limit=2')
        .expect(200);

      const body = response.body as {
        data: Contact[];
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

  describe('GET /api/contacts/:id', () => {
    it('should return a contact by id (public)', async () => {
      const repository = dataSource.getRepository(Contact);
      const contact = await repository.save({
        name: 'Ivan Reis',
        email: 'ivan@email.com',
        description: 'Busca por ID.',
      });

      const response = await request(app.getHttpServer())
        .get(`/api/contacts/${contact.id}`)
        .expect(200);

      const body = response.body as Contact;
      expect(body.id).toBe(contact.id);
      expect(body.name).toBe('Ivan Reis');
    });

    it('should return 404 for non-existent id', () => {
      return request(app.getHttpServer())
        .get('/api/contacts/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d')
        .expect(404);
    });
  });

  describe('PATCH /api/contacts/:id', () => {
    it('should update a contact partially (with token)', async () => {
      const repository = dataSource.getRepository(Contact);
      const contact = await repository.save({
        name: 'Nome Original',
        email: 'original@email.com',
        description: 'Descrição original.',
      });

      const response = await request(app.getHttpServer())
        .patch(`/api/contacts/${contact.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Nome Atualizado' })
        .expect(200);

      const body = response.body as Contact;
      expect(body.name).toBe('Nome Atualizado');
      expect(body.email).toBe('original@email.com');
    });

    it('should return 401 without token', async () => {
      const repository = dataSource.getRepository(Contact);
      const contact = await repository.save({
        name: 'Contato',
        email: 'contato@email.com',
        description: 'Desc.',
      });

      return request(app.getHttpServer())
        .patch(`/api/contacts/${contact.id}`)
        .send({ name: 'Teste' })
        .expect(401);
    });

    it('should return 404 for non-existent id', () => {
      return request(app.getHttpServer())
        .patch('/api/contacts/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Teste' })
        .expect(404);
    });
  });

  describe('DELETE /api/contacts/:id', () => {
    it('should delete a contact (with token)', async () => {
      const repository = dataSource.getRepository(Contact);
      const contact = await repository.save({
        name: 'Para Remover',
        email: 'remover@email.com',
        description: 'Será removido.',
      });

      return request(app.getHttpServer())
        .delete(`/api/contacts/${contact.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);
    });

    it('should return 401 without token', async () => {
      const repository = dataSource.getRepository(Contact);
      const contact = await repository.save({
        name: 'Contato',
        email: 'contato@email.com',
        description: 'Desc.',
      });

      return request(app.getHttpServer())
        .delete(`/api/contacts/${contact.id}`)
        .expect(401);
    });

    it('should return 404 for non-existent id', () => {
      return request(app.getHttpServer())
        .delete('/api/contacts/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});
