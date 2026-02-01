import { DataSource, DataSourceOptions } from 'typeorm';
import { SeederOptions } from 'typeorm-extension';
import { config } from 'dotenv';

config();

const isProduction = process.env.NODE_ENV === 'production';

const options: DataSourceOptions & SeederOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: true,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
  entities: ['src/modules/**/entities/*.entity.ts'],
  seeds: ['src/database/seeds/**/*{.ts,.js}'],
  factories: [],
};

export const dataSource = new DataSource(options);
