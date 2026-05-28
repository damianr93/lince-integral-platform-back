import { BadRequestException, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@lince/auth';
import { ReportsService } from './reports.service';
import { ReportMailerService } from './report-mailer.service';
import { Planta } from '../entities/empleado.entity';

const FECHA_YMD = /^\d{4}-\d{2}-\d{2}$/;

@UseGuards(JwtAuthGuard)
@Controller('asistencia/reports')
export class ReportsController {
  constructor(
    private readonly service: ReportsService,
    private readonly mailer: ReportMailerService,
  ) {}

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

  /** POST /api/asistencia/reports/send-daily?ymd=2026-05-27 — disparo manual del reporte */
  @Post('send-daily')
  async sendDailyReport(@Query('ymd') ymd?: string) {
    const target = ymd?.trim() ?? '';
    if (!FECHA_YMD.test(target)) {
      throw new BadRequestException('ymd debe ser YYYY-MM-DD');
    }
    await this.mailer.sendDailyReport(target);
    return { sent: true, ymd: target };
  }

  /** GET /api/asistencia/reports/employee/:id/range?desde=2026-04-01&hasta=2026-04-30&horasEsperadasPorDia=9 */
  @Get('employee/:id/range')
  getEmployeeRangeReport(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('horasEsperadasPorDia') horasEsperadasPorDia?: string,
  ) {
    return this.service.getEmployeeRangeReport({
      empleadoId: id,
      desde,
      hasta,
      horasEsperadasPorDia,
    });
  }
}
