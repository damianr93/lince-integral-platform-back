import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@lince/auth';
import { ReportsService } from './reports.service';
import { Planta } from '../entities/empleado.entity';

@UseGuards(JwtAuthGuard)
@Controller('asistencia/reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  /** GET /api/asistencia/reports/present-now?planta=tucuman */
  @Get('present-now')
  getPresentNow(@Query('planta') planta?: Planta) {
    return this.service.getPresentNow(planta);
  }

  /** GET /api/asistencia/reports/daily-summary?planta=villa_nueva */
  @Get('daily-summary')
  getDailySummary(@Query('planta') planta?: Planta) {
    return this.service.getDailySummary(planta);
  }

  /** GET /api/asistencia/reports/attendance?planta=tucuman&desde=2025-01-01&hasta=2025-01-31 */
  @Get('attendance')
  getAttendance(
    @Query('planta')     planta?: Planta,
    @Query('empleadoId') empleadoId?: string,
    @Query('desde')      desde?: string,
    @Query('hasta')      hasta?: string,
    @Query('estado')     estado?: string,
    @Query('page')       page?: string,
    @Query('limit')      limit?: string,
  ) {
    return this.service.getAttendance({ planta, empleadoId, desde, hasta, estado, page, limit });
  }

  /** GET /api/asistencia/reports/employee/:id/history */
  @Get('employee/:id/history')
  getEmployeeHistory(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('limit') limit?: number,
  ) {
    return this.service.getEmployeeHistory(id, limit);
  }
}
