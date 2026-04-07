import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EquipoEntity } from '../entities/equipo.entity';
import { EquiposController } from './equipos.controller';
import { EquiposService } from './equipos.service';

@Module({
  imports: [TypeOrmModule.forFeature([EquipoEntity])],
  controllers: [EquiposController],
  providers: [EquiposService],
  exports: [EquiposService],
})
export class EquiposModule {}
