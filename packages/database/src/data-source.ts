import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { UserEntity } from './entities/user.entity';

export const entities: Function[] = [UserEntity];

export function buildDataSourceOptions(
  databaseUrl: string,
  extraEntities: Function[] = [],
): DataSourceOptions {
  return {
    type: 'postgres',
    url: databaseUrl,
    entities: [...entities, ...extraEntities],
    migrations: [__dirname + '/migrations/*.{ts,js}'],
    synchronize:
      process.env['NODE_ENV'] !== 'production' ||
      process.env['DB_SYNCHRONIZE'] === 'true',
    logging: ['error', 'warn'],
  };
}

/**
 * Standalone DataSource for TypeORM CLI (migrations).
 * Requires DATABASE_URL env var.
 */
const AppDataSource = new DataSource(
  buildDataSourceOptions(process.env['DATABASE_URL'] ?? ''),
);

export default AppDataSource;
