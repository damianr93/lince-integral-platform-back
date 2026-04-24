import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmpleadoEntity } from './entities/empleado.entity';
import { FichajeEntity }  from './entities/fichaje.entity';
import { RawLogEntity }   from './entities/raw-log.entity';
import { AdmsController } from './adms/adms.controller';
import { AdmsService }    from './adms/adms.service';
import { EmployeesController } from './employees/employees.controller';
import { EmployeesService }    from './employees/employees.service';
import { LogsService }         from './logs/logs.service';
import { LogsController }      from './logs/logs.controller';
import { ReportsController }   from './reports/reports.controller';
import { ReportsService }      from './reports/reports.service';
import { DebugController }     from './debug/debug.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmpleadoEntity, FichajeEntity, RawLogEntity]),
  ],
  controllers: [
    AdmsController,
    EmployeesController,
    ReportsController,
    LogsController,
    DebugController,
  ],
  providers: [
    AdmsService,
    EmployeesService,
    LogsService,
    ReportsService,
  ],
  exports: [AdmsService, EmployeesService, LogsService, ReportsService],
})
export class AsistenciaModule {}
