import { Controller, Get, Param, ParseUUIDPipe, Patch, Query, UseGuards, Body, Post } from '@nestjs/common';
import { JwtAuthGuard } from '@lince/auth';
import { Planta } from '../entities/empleado.entity';
import { EstadoFichaje, FichajeEntity } from '../entities/fichaje.entity';
import { LogsService } from './logs.service';
import { UpdateFichajeDto } from './dto/update-fichaje.dto';

const AR_TZ = 'America/Argentina/Buenos_Aires';

function getDatePart(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
): string {
  return parts.find((part) => part.type === type)?.value ?? '00';
}

function toArgentinaIso(value: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: AR_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(value);

  const ymd = [
    getDatePart(parts, 'year'),
    getDatePart(parts, 'month'),
    getDatePart(parts, 'day'),
  ].join('-');
  const hms = [
    getDatePart(parts, 'hour'),
    getDatePart(parts, 'minute'),
    getDatePart(parts, 'second'),
  ].join(':');
  return `${ymd}T${hms}-03:00`;
}

@UseGuards(JwtAuthGuard)
@Controller('asistencia/logs')
export class LogsController {
  constructor(private readonly service: LogsService) {}

  private serializeFichaje(fichaje: FichajeEntity) {
    return {
      ...fichaje,
      tiempo: toArgentinaIso(fichaje.tiempo),
    };
  }

  @Get()
  async findAll(
    @Query('planta') planta?: Planta,
    @Query('empleadoId') empleadoId?: string,
    @Query('pin') pin?: string,
    @Query('nombre') nombre?: string,
    @Query('fecha') fecha?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('estado') estado?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedEstado =
      estado === undefined || estado === ''
        ? undefined
        : (Number(estado) as EstadoFichaje);

    const fechaTrim = fecha?.trim();
    const result = await this.service.findAll({
      planta,
      empleadoId,
      pin,
      nombre,
      fechaDia: fechaTrim || undefined,
      desde: fechaTrim ? undefined : (desde ? new Date(desde) : undefined),
      hasta: fechaTrim ? undefined : (hasta ? new Date(hasta) : undefined),
      estado: parsedEstado,
      page: fechaTrim ? undefined : (page ? Number(page) : undefined),
      limit: fechaTrim ? undefined : (limit ? Number(limit) : undefined),
    });

    if (fechaTrim) {
      return {
        items: result.items.map((item) => this.serializeFichaje(item)),
        total: result.total,
        fecha: fechaTrim,
        page: 1,
        pages: 1,
        limit: result.total,
      };
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(200, Math.max(1, Number(limit) || 50));
    const pages = Math.max(1, Math.ceil(result.total / limitNum));

    return {
      items: result.items.map((item) => this.serializeFichaje(item)),
      total: result.total,
      page: pageNum,
      limit: limitNum,
      pages,
    };
  }

  @Patch(':id')
  async updateById(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFichajeDto,
  ) {
    const updated = await this.service.updateById(id, {
      estado: dto.estado,
      tiempo: dto.tiempo ? new Date(dto.tiempo) : undefined,
      empleadoId: dto.empleadoId,
    });
    return this.serializeFichaje(updated);
  }

  @Post('reconcile-unmatched')
  reconcileUnmatched(@Query('limit') limit?: string) {
    return this.service.reconcileUnmatched(limit ? Number(limit) : undefined);
  }
}
