import { DataSource } from 'typeorm';
import PermissionSeeder from '../../src/database/seeds/01-permission.seeder';
import RoleSeeder from '../../src/database/seeds/02-role.seeder';
import UserSeeder from '../../src/database/seeds/03-user.seeder';
import ContactSeeder from '../../src/database/seeds/04-contact.seeder';

export async function truncateAllTables(dataSource: DataSource): Promise<void> {
  const entities = dataSource.entityMetadatas;

  if (entities.length === 0) {
    return;
  }

  const tableNames = entities
    .map((entity) => `"${entity.tableName}"`)
    .join(', ');

  await dataSource.query(
    `TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE`,
  );
}

export async function seedTestDatabase(dataSource: DataSource): Promise<void> {
  const seeders = [
    new PermissionSeeder(),
    new RoleSeeder(),
    new UserSeeder(),
    new ContactSeeder(),
  ];

  for (const seeder of seeders) {
    await seeder.run(dataSource);
  }
}
