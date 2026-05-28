import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { buildDataSourceOptions, AreaEntity } from '@lince/database';
import { AuthModule } from '@lince/auth';
import { CrmModule } from '@lince/crm';
import { ConciliacionesModule, conciliacionesEntities } from '@lince/conciliaciones';
import { OcrModule, ocrEntities } from '@lince/ocr';
import { SoporteItModule, soporteItEntities } from '@lince/soporte-it';
import { AsistenciaModule, asistenciaEntities } from '@lince/asistencia';
import { LogisticaModule, logisticaEntities } from '@lince/logistica';
import { UsersModule } from './users/users.module';
import { AreasModule } from './areas/areas.module';

@Module({
  imports: [
    // Configuración global de variables de entorno
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Scheduler global — necesario para que los @Cron de todos los módulos funcionen
    ScheduleModule.forRoot(),

    // TypeORM — conecta a PostgreSQL usando DATABASE_URL
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        buildDataSourceOptions(
          config.getOrThrow<string>('DATABASE_URL'),
          [...conciliacionesEntities, ...ocrEntities, ...soporteItEntities, ...asistenciaEntities, ...logisticaEntities, AreaEntity],
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

    // Módulo OCR (remitos + facturas + Google Document AI/Vision + S3)
    OcrModule,

    // Módulo Soporte IT (equipos + incidentes + relevamientos técnicos)
    SoporteItModule,

    // Módulo Asistencia (relojes ZKTeco + empleados + fichajes + reportes RRHH)
    AsistenciaModule,

    // Módulo Logística (remitos + mapa georeferenciado)
    LogisticaModule,
  ],
})
export class AppModule {}
