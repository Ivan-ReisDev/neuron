import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import ContactSeeder from '../../database/seeds/01-contact.seeder';
import UserSeeder from '../../database/seeds/02-user.seeder';

@Injectable()
export class SeederService implements OnModuleInit {
  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';

    if (isProduction) {
      return;
    }

    const isEmpty = await this.isDatabaseEmpty();

    if (!isEmpty) {
      return;
    }

    await this.executeSeeders();
  }

  private async isDatabaseEmpty(): Promise<boolean> {
    const entities = this.dataSource.entityMetadatas;

    if (entities.length === 0) {
      return true;
    }

    for (const entity of entities) {
      const repository = this.dataSource.getRepository(entity.name);
      const count = await repository.count();

      if (count > 0) {
        return false;
      }
    }

    return true;
  }

  private async executeSeeders(): Promise<void> {
    const seeders = [new ContactSeeder(), new UserSeeder()];

    for (const seeder of seeders) {
      await seeder.run(this.dataSource);
    }
  }
}
