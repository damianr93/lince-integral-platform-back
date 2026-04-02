import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { buildDataSourceOptions, AreaEntity } from '@lince/database';
import { AuthModule } from '@lince/auth';
import { CrmModule } from '@lince/crm';
import { ConciliacionesModule, conciliacionesEntities } from '@lince/conciliaciones';
import { OcrModule, ocrEntities } from '@lince/ocr';
import { UsersModule } from './users/users.module';
import { AreasModule } from './areas/areas.module';

@Module({
  imports: [
    // Configuración global de variables de entorno
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // TypeORM — conecta a PostgreSQL usando DATABASE_URL
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        buildDataSourceOptions(
          config.getOrThrow<string>('DATABASE_URL'),
          [...conciliacionesEntities, ...ocrEntities, AreaEntity],
        ),
    }),

    // Módulo de autenticación (JWT + guards + decoradores)
    AuthModule,

    // Módulo de usuarios (CRUD + gestión de módulos por usuario)
    UsersModule,

    // Módulo de áreas (departamentos de la empresa)
    AreasModule,

    // Módulo CRM (clientes, follow-up, analytics, satisfaction, geo)
    CrmModule,

    // Módulo Conciliaciones bancarias
    ConciliacionesModule,

    // Módulo OCR (remitos + facturas + Google Vision + S3)
    OcrModule,
  ],
})
export class AppModule {}
