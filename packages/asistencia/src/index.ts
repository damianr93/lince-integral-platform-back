export { AsistenciaModule } from './asistencia.module';
export { EmpleadoEntity, Planta } from './entities/empleado.entity';
export { FichajeEntity, EstadoFichaje } from './entities/fichaje.entity';
export { RawLogEntity } from './entities/raw-log.entity';

import { EmpleadoEntity } from './entities/empleado.entity';
import { FichajeEntity }  from './entities/fichaje.entity';
import { RawLogEntity }   from './entities/raw-log.entity';

export const asistenciaEntities = [EmpleadoEntity, FichajeEntity, RawLogEntity];
