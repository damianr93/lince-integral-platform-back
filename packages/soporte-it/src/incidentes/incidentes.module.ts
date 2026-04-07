import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IncidenteEntity } from '../entities/incidente.entity';
import { EquiposModule } from '../equipos/equipos.module';
import { IncidentesController } from './incidentes.controller';
import { IncidentesService } from './incidentes.service';

@Module({
  imports: [TypeOrmModule.forFeature([IncidenteEntity]), EquiposModule],
  controllers: [IncidentesController],
  providers: [IncidentesService],
  exports: [IncidentesService],
})
export class IncidentesModule {}
