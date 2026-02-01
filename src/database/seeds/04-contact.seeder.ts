import { DataSource } from 'typeorm';
import { Contact } from '../../modules/contact/entities/contact.entity';

export default class ContactSeeder {
  async run(dataSource: DataSource): Promise<void> {
    const repository = dataSource.getRepository(Contact);

    await repository.upsert(
      [
        {
          name: 'Ivan Reis',
          email: 'ivan@neuron.dev',
          phone: '+55 11 99999-0001',
          description:
            'Desenvolvedor full-stack com experiência em NestJS e React.',
        },
        {
          name: 'Maria Silva',
          email: 'maria@email.com',
          phone: null,
          description: 'Interessada em colaboração para projetos open source.',
        },
        {
          name: 'João Santos',
          email: 'joao@empresa.com.br',
          phone: '+55 21 98888-0002',
          description: 'Proposta comercial para desenvolvimento de API.',
        },
      ],
      ['email'],
    );
  }
}
