import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { User } from '../../modules/user/entities/user.entity';
import { Role } from '../../modules/role/entities/role.entity';

const SALT_ROUNDS = 10;

export default class UserSeeder {
  async run(dataSource: DataSource): Promise<void> {
    const userRepository = dataSource.getRepository(User);
    const roleRepository = dataSource.getRepository(Role);

    const adminRole = await roleRepository.findOneByOrFail({ name: 'ADMIN' });
    const userRole = await roleRepository.findOneByOrFail({ name: 'USER' });

    const adminPassword = await bcrypt.hash('Admin@123', SALT_ROUNDS);
    const userPassword = await bcrypt.hash('User@1234', SALT_ROUNDS);

    await userRepository.upsert(
      [
        {
          name: 'Admin Neuron',
          email: 'admin@neuron.dev',
          password: adminPassword,
          roleId: adminRole.id,
          isActive: true,
        },
        {
          name: 'Ivan Reis',
          email: 'ivan@neuron.dev',
          password: userPassword,
          roleId: userRole.id,
          isActive: true,
        },
        {
          name: 'Maria Silva',
          email: 'maria@email.com',
          password: userPassword,
          roleId: userRole.id,
          isActive: false,
        },
      ],
      ['email'],
    );
  }
}
