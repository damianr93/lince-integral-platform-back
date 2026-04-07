import { Module } from '@nestjs/common';
import { EquiposModule } from './equipos/equipos.module';
import { IncidentesModule } from './incidentes/incidentes.module';
import { RelevamientosModule } from './relevamientos/relevamientos.module';

@Module({
  imports: [EquiposModule, IncidentesModule, RelevamientosModule],
  exports: [EquiposModule, IncidentesModule, RelevamientosModule],
})
export class SoporteItModule {}
