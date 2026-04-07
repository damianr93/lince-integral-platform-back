export * from './soporte-it.module';
export * from './entities/equipo.entity';
export * from './entities/incidente.entity';
export * from './entities/relevamiento.entity';
export * from './entities/relevamiento-item.entity';

import { EquipoEntity } from './entities/equipo.entity';
import { IncidenteEntity } from './entities/incidente.entity';
import { RelevamientoEntity } from './entities/relevamiento.entity';
import { RelevamientoItemEntity } from './entities/relevamiento-item.entity';

export const soporteItEntities = [
  EquipoEntity,
  IncidenteEntity,
  RelevamientoEntity,
  RelevamientoItemEntity,
];
