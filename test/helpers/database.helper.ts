import { DataSource } from 'typeorm';
import ContactSeeder from '../../src/database/seeds/01-contact.seeder';

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
  const seeders = [new ContactSeeder()];

  for (const seeder of seeders) {
    await seeder.run(dataSource);
  }
}
