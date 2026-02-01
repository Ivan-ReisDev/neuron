import { DataSource } from 'typeorm';
import { runSeeders, SeederOptions } from 'typeorm-extension';

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
  const seederOptions: SeederOptions = {
    seeds: ['dist/database/seeds/**/*{.ts,.js}'],
    factories: ['dist/database/factories/**/*{.ts,.js}'],
  };

  await runSeeders(dataSource, seederOptions);
}
