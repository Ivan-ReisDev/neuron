import { runSeeders } from 'typeorm-extension';
import { dataSource } from './data-source';

async function seed(): Promise<void> {
  await dataSource.initialize();
  await runSeeders(dataSource);
  await dataSource.destroy();
}

seed().catch(() => {
  process.exit(1);
});
