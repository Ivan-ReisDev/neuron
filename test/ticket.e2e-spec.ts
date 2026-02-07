import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AppModule } from './../src/app.module';
import { Ticket } from './../src/modules/ticket/entities/ticket.entity';
import { User } from './../src/modules/user/entities/user.entity';
import { TicketPriority } from './../src/modules/ticket/enums/ticket-priority.enum';
import { TicketStatus } from './../src/modules/ticket/enums/ticket-status.enum';
import { truncateAllTables } from './helpers/database.helper';
import { seedPermissionsAndRoles, getAdminToken } from './helpers/auth.helper';

const SALT_ROUNDS = 10;

describe('Tickets (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let adminToken: string;
  let userToken: string;
  let userId: string;

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
    const testUser = await userRepository.save({
      name: 'Test User',
      email: 'user@test.com',
      password: await bcrypt.hash('User@123', SALT_ROUNDS),
      roleId: userRole.id,
      isActive: true,
    });
    userId = testUser.id;

    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'user@test.com', password: 'User@123' });

    userToken = (loginResponse.body as { accessToken: string }).accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/tickets', () => {
    it('should create a ticket as USER with minimal data', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/tickets')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Erro no login',
          description: 'A página retorna erro 500 ao tentar logar.',
        })
        .expect(201);

      const body = response.body as Ticket;
      expect(body.id).toBeDefined();
      expect(body.title).toBe('Erro no login');
      expect(body.description).toBe(
        'A página retorna erro 500 ao tentar logar.',
      );
      expect(body.priority).toBe(TicketPriority.MEDIUM);
      expect(body.status).toBe(TicketStatus.OPEN);
      expect(body.userId).toBe(userId);
      expect(body.links).toBeNull();
    });

    it('should create a ticket with priority and links', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/tickets')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Bug no dashboard',
          description: 'Gráficos não carregam.',
          priority: TicketPriority.URGENT,
          links: ['https://exemplo.com/screenshot.png'],
        })
        .expect(201);

      const body = response.body as Ticket;
      expect(body.priority).toBe(TicketPriority.URGENT);
      expect(body.links).toContain('https://exemplo.com/screenshot.png');
    });

    it('should create a ticket as ADMIN', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/tickets')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Ticket do admin',
          description: 'Criado pelo admin.',
        })
        .expect(201);

      const body = response.body as Ticket;
      expect(body.id).toBeDefined();
      expect(body.title).toBe('Ticket do admin');
    });

    it('should return 400 when title is missing', () => {
      return request(app.getHttpServer())
        .post('/api/tickets')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          description: 'Sem título.',
        })
        .expect(400);
    });

    it('should return 400 when description is missing', () => {
      return request(app.getHttpServer())
        .post('/api/tickets')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Sem descrição',
        })
        .expect(400);
    });

    it('should return 400 when links contain invalid URL', () => {
      return request(app.getHttpServer())
        .post('/api/tickets')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Link inválido',
          description: 'Teste.',
          links: ['nao-e-uma-url'],
        })
        .expect(400);
    });

    it('should return 400 when priority is invalid', () => {
      return request(app.getHttpServer())
        .post('/api/tickets')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Prioridade inválida',
          description: 'Teste.',
          priority: 'invalid',
        })
        .expect(400);
    });

    it('should return 401 without token', () => {
      return request(app.getHttpServer())
        .post('/api/tickets')
        .send({
          title: 'Sem token',
          description: 'Teste.',
        })
        .expect(401);
    });
  });

  describe('GET /api/tickets', () => {
    beforeEach(async () => {
      const ticketRepository = dataSource.getRepository(Ticket);
      await ticketRepository.save([
        {
          title: 'Ticket do user',
          description: 'Criado pelo user.',
          userId,
          priority: TicketPriority.LOW,
          status: TicketStatus.OPEN,
        },
        {
          title: 'Outro ticket do user',
          description: 'Segundo ticket.',
          userId,
          priority: TicketPriority.HIGH,
          status: TicketStatus.OPEN,
        },
      ]);

      const adminUser = await dataSource
        .getRepository(User)
        .findOne({ where: { email: 'admin@test.com' } });

      await ticketRepository.save({
        title: 'Ticket do admin',
        description: 'Criado pelo admin.',
        userId: adminUser!.id,
        priority: TicketPriority.MEDIUM,
        status: TicketStatus.OPEN,
      });
    });

    it('should return all tickets for ADMIN', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/tickets')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = response.body as {
        data: Ticket[];
        meta: { totalItems: number; page: number };
      };
      expect(body.data).toHaveLength(3);
      expect(body.meta.totalItems).toBe(3);
    });

    it('should return only own tickets for USER', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/tickets')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const body = response.body as {
        data: Ticket[];
        meta: { totalItems: number };
      };
      expect(body.data).toHaveLength(2);
      expect(body.meta.totalItems).toBe(2);
      body.data.forEach((ticket) => {
        expect(ticket.userId).toBe(userId);
      });
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/tickets?page=1&limit=1')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const body = response.body as {
        data: Ticket[];
        meta: { totalItems: number; totalPages: number; hasNextPage: boolean };
      };
      expect(body.data).toHaveLength(1);
      expect(body.meta.totalItems).toBe(2);
      expect(body.meta.totalPages).toBe(2);
      expect(body.meta.hasNextPage).toBe(true);
    });

    it('should return 401 without token', () => {
      return request(app.getHttpServer()).get('/api/tickets').expect(401);
    });
  });

  describe('GET /api/tickets/:id', () => {
    let userTicketId: string;
    let adminTicketId: string;

    beforeEach(async () => {
      const ticketRepository = dataSource.getRepository(Ticket);

      const userTicket = await ticketRepository.save({
        title: 'Ticket do user',
        description: 'Para buscar por ID.',
        userId,
        priority: TicketPriority.LOW,
        status: TicketStatus.OPEN,
      });
      userTicketId = userTicket.id;

      const adminUser = await dataSource
        .getRepository(User)
        .findOne({ where: { email: 'admin@test.com' } });

      const adminTicket = await ticketRepository.save({
        title: 'Ticket do admin',
        description: 'Ticket de outro usuário.',
        userId: adminUser!.id,
        priority: TicketPriority.HIGH,
        status: TicketStatus.OPEN,
      });
      adminTicketId = adminTicket.id;
    });

    it('should return own ticket for USER', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/tickets/${userTicketId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const body = response.body as Ticket;
      expect(body.id).toBe(userTicketId);
      expect(body.userId).toBe(userId);
    });

    it('should return any ticket for ADMIN', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/tickets/${userTicketId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = response.body as Ticket;
      expect(body.id).toBe(userTicketId);
    });

    it('should return 403 when USER tries to access another users ticket', () => {
      return request(app.getHttpServer())
        .get(`/api/tickets/${adminTicketId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should return 404 for non-existent id', () => {
      return request(app.getHttpServer())
        .get('/api/tickets/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should return 400 for invalid uuid', () => {
      return request(app.getHttpServer())
        .get('/api/tickets/invalid-uuid')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });
  });

  describe('PATCH /api/tickets/:id', () => {
    let ticketId: string;

    beforeEach(async () => {
      const ticketRepository = dataSource.getRepository(Ticket);
      const ticket = await ticketRepository.save({
        title: 'Ticket para atualizar',
        description: 'Será atualizado.',
        userId,
        priority: TicketPriority.LOW,
        status: TicketStatus.OPEN,
      });
      ticketId = ticket.id;
    });

    it('should update a ticket as ADMIN', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: TicketStatus.IN_PROGRESS,
          priority: TicketPriority.URGENT,
        })
        .expect(200);

      const body = response.body as Ticket;
      expect(body.status).toBe(TicketStatus.IN_PROGRESS);
      expect(body.priority).toBe(TicketPriority.URGENT);
      expect(body.title).toBe('Ticket para atualizar');
    });

    it('should update ticket links as ADMIN', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          links: ['https://exemplo.com/log.txt'],
        })
        .expect(200);

      const body = response.body as Ticket;
      expect(body.links).toContain('https://exemplo.com/log.txt');
    });

    it('should return 403 when USER tries to update', () => {
      return request(app.getHttpServer())
        .patch(`/api/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: TicketStatus.CLOSED })
        .expect(403);
    });

    it('should return 404 for non-existent id', () => {
      return request(app.getHttpServer())
        .patch('/api/tickets/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: TicketStatus.CLOSED })
        .expect(404);
    });
  });

  describe('DELETE /api/tickets/:id', () => {
    let ticketId: string;

    beforeEach(async () => {
      const ticketRepository = dataSource.getRepository(Ticket);
      const ticket = await ticketRepository.save({
        title: 'Ticket para remover',
        description: 'Será removido.',
        userId,
        priority: TicketPriority.LOW,
        status: TicketStatus.OPEN,
      });
      ticketId = ticket.id;
    });

    it('should delete a ticket as ADMIN', () => {
      return request(app.getHttpServer())
        .delete(`/api/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);
    });

    it('should return 403 when USER tries to delete', () => {
      return request(app.getHttpServer())
        .delete(`/api/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should return 404 for non-existent id', () => {
      return request(app.getHttpServer())
        .delete('/api/tickets/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});
