import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { UserEntity, AreaEntity } from '@lince/database';
import { conciliacionesEntities } from '@lince/conciliaciones';

export default new DataSource({
  type: 'postgres',
  url: process.env['DATABASE_URL'],
  entities: [UserEntity, AreaEntity, ...conciliacionesEntities],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  synchronize: false,
  logging: ['error', 'warn', 'migration'],
});
