import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RelevamientoEntity } from '../entities/relevamiento.entity';
import { RelevamientoItemEntity } from '../entities/relevamiento-item.entity';
import { IncidentesModule } from '../incidentes/incidentes.module';
import { RelevamientosController } from './relevamientos.controller';
import { RelevamientosService } from './relevamientos.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([RelevamientoEntity, RelevamientoItemEntity]),
    IncidentesModule,
  ],
  controllers: [RelevamientosController],
  providers: [RelevamientosService],
})
export class RelevamientosModule {}
