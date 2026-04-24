export { AsistenciaModule } from './asistencia.module';
export { EmpleadoEntity, Planta } from './entities/empleado.entity';
export { FichajeEntity, EstadoFichaje } from './entities/fichaje.entity';
export { RawLogEntity } from './entities/raw-log.entity';

export const asistenciaEntities = [
  require('./entities/empleado.entity').EmpleadoEntity,
  require('./entities/fichaje.entity').FichajeEntity,
  require('./entities/raw-log.entity').RawLogEntity,
];
