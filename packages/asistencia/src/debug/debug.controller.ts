import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@lince/auth';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { RawLogEntity } from '../entities/raw-log.entity';
import { FichajeEntity } from '../entities/fichaje.entity';
import { AdmsService } from '../adms/adms.service';
import { EstadoFichaje } from '../entities/fichaje.entity';

class SimulatePunchDto {
  @IsString()
  @IsNotEmpty()
  pin: string;

  @IsEnum(EstadoFichaje)
  status: EstadoFichaje;

  @IsString()
  @IsNotEmpty()
  deviceSn: string;
}

@UseGuards(JwtAuthGuard)
@Controller('asistencia/debug')
export class DebugController {
  constructor(
    private readonly admsService: AdmsService,
    @InjectRepository(RawLogEntity)
    private readonly rawLogRepo: Repository<RawLogEntity>,
    @InjectRepository(FichajeEntity)
    private readonly fichajeRepo: Repository<FichajeEntity>,
  ) {}

  /**
   * GET /api/asistencia/debug/raw-logs
   * Últimos 50 registros crudos del reloj — para diagnóstico durante integración.
   */
  @Get('raw-logs')
  async getRawLogs(@Query('limit') limit = 50) {
    return this.rawLogRepo.find({
      order: { createdAt: 'DESC' },
      take: Math.min(Number(limit), 200),
    });
  }

  /**
   * POST /api/asistencia/debug/simulate-punch
   * Simula un fichaje sin necesitar el reloj físico conectado.
   * Body: { pin: "3", status: 0, deviceSn: "SERIAL_TUCUMAN" }
   */
  @Post('simulate-punch')
  simulatePunch(@Body() dto: SimulatePunchDto) {
    return this.admsService.simulatePunch(dto.pin, dto.status, dto.deviceSn);
  }

  /**
   * DELETE /api/asistencia/debug/raw-logs
   * Borra todos los raw logs (útil para limpiar registros de prueba).
   */
  @Delete('raw-logs/:id')
  async deleteRawLog(@Param('id') id: string) {
    const result = await this.rawLogRepo.delete(id);
    return { deleted: (result.affected ?? 0) > 0, affected: result.affected };
  }

  @Delete('fichajes/:id')
  async deleteFichaje(@Param('id') id: string) {
    const result = await this.fichajeRepo.delete(id);
    return { deleted: (result.affected ?? 0) > 0, affected: result.affected };
  }
}
