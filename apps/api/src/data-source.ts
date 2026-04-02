import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

dotenv.config();
import { UserEntity, AreaEntity } from '@lince/database';
import { conciliacionesEntities } from '@lince/conciliaciones';
import { ocrEntities } from '@lince/ocr';

export default new DataSource({
  type: 'postgres',
  url: process.env['DATABASE_URL'],
  entities: [UserEntity, AreaEntity, ...conciliacionesEntities, ...ocrEntities],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  synchronize: false,
  logging: ['error', 'warn', 'migration'],
});
