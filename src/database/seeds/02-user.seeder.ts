import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { User } from '../../modules/user/entities/user.entity';
import { UserRole } from '../../modules/user/enums/user-role.enum';

const SALT_ROUNDS = 10;

export default class UserSeeder {
  async run(dataSource: DataSource): Promise<void> {
    const repository = dataSource.getRepository(User);

    const adminPassword = await bcrypt.hash('Admin@123', SALT_ROUNDS);
    const userPassword = await bcrypt.hash('User@1234', SALT_ROUNDS);

    await repository.insert([
      {
        name: 'Admin Neuron',
        email: 'admin@neuron.dev',
        password: adminPassword,
        role: UserRole.ADMIN,
        isActive: true,
      },
      {
        name: 'Ivan Reis',
        email: 'ivan@neuron.dev',
        password: userPassword,
        role: UserRole.USER,
        isActive: true,
      },
      {
        name: 'Maria Silva',
        email: 'maria@email.com',
        password: userPassword,
        role: UserRole.USER,
        isActive: false,
      },
    ]);
  }
}
