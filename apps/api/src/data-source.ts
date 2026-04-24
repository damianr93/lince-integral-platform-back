import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

dotenv.config();
import { UserEntity, AreaEntity } from '@lince/database';
import { conciliacionesEntities } from '@lince/conciliaciones';
import { ocrEntities } from '@lince/ocr';
import { soporteItEntities } from '@lince/soporte-it';
import { asistenciaEntities } from '@lince/asistencia';

export default new DataSource({
  type: 'postgres',
  url: process.env['DATABASE_URL'],
  entities: [UserEntity, AreaEntity, ...conciliacionesEntities, ...ocrEntities, ...soporteItEntities, ...asistenciaEntities],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  synchronize: false,
  logging: ['error', 'warn', 'migration'],
});
