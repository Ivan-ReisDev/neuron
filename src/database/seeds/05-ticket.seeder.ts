import { DataSource } from 'typeorm';
import { Ticket } from '../../modules/ticket/entities/ticket.entity';
import { User } from '../../modules/user/entities/user.entity';
import { TicketPriority } from '../../modules/ticket/enums/ticket-priority.enum';
import { TicketStatus } from '../../modules/ticket/enums/ticket-status.enum';

export default class TicketSeeder {
  async run(dataSource: DataSource): Promise<void> {
    const ticketRepository = dataSource.getRepository(Ticket);
    const userRepository = dataSource.getRepository(User);

    const adminUser = await userRepository.findOneByOrFail({
      email: 'admin@neuron.dev',
    });

    const regularUser = await userRepository.findOneByOrFail({
      email: 'ivan@neuron.dev',
    });

    const existingCount = await ticketRepository.count();

    if (existingCount > 0) {
      return;
    }

    await ticketRepository.save([
      {
        title: 'Erro ao carregar dashboard',
        description:
          'O dashboard não carrega os gráficos de desempenho após o login.',
        priority: TicketPriority.HIGH,
        status: TicketStatus.OPEN,
        links: ['https://exemplo.com/logs/dashboard-error.txt'],
        userId: regularUser.id,
      },
      {
        title: 'Botão de exportação não funciona',
        description:
          'Ao clicar no botão de exportar relatório em PDF, nada acontece.',
        priority: TicketPriority.MEDIUM,
        status: TicketStatus.IN_PROGRESS,
        links: null,
        userId: regularUser.id,
      },
      {
        title: 'Atualizar dependências do projeto',
        description:
          'Atualizar todas as dependências do projeto para as versões mais recentes.',
        priority: TicketPriority.LOW,
        status: TicketStatus.OPEN,
        links: [
          'https://exemplo.com/docs/upgrade-guide.md',
          'https://exemplo.com/changelog.md',
        ],
        userId: adminUser.id,
      },
      {
        title: 'Sistema fora do ar em produção',
        description:
          'O servidor de produção retorna erro 502 Bad Gateway para todas as requisições.',
        priority: TicketPriority.URGENT,
        status: TicketStatus.OPEN,
        links: ['https://exemplo.com/monitoring/incident-001.png'],
        userId: adminUser.id,
      },
      {
        title: 'Melhoria no formulário de contato',
        description:
          'Adicionar validação de telefone no formulário de contato do portfólio.',
        priority: TicketPriority.LOW,
        status: TicketStatus.CLOSED,
        links: null,
        userId: regularUser.id,
      },
    ]);
  }
}
