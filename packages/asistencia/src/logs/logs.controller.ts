import { Controller, Get, Param, ParseUUIDPipe, Patch, Query, UseGuards, Body, Post } from '@nestjs/common';
import { JwtAuthGuard } from '@lince/auth';
import { Planta } from '../entities/empleado.entity';
import { EstadoFichaje } from '../entities/fichaje.entity';
import { LogsService } from './logs.service';
import { UpdateFichajeDto } from './dto/update-fichaje.dto';

@UseGuards(JwtAuthGuard)
@Controller('asistencia/logs')
export class LogsController {
  constructor(private readonly service: LogsService) {}

  @Get()
  async findAll(
    @Query('planta') planta?: Planta,
    @Query('empleadoId') empleadoId?: string,
    @Query('pin') pin?: string,
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

    const result = await this.service.findAll({
      planta,
      empleadoId,
      pin,
      desde: desde ? new Date(desde) : undefined,
      hasta: hasta ? new Date(hasta) : undefined,
      estado: parsedEstado,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(200, Math.max(1, Number(limit) || 50));
    const pages = Math.max(1, Math.ceil(result.total / limitNum));

    return {
      items: result.items,
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
    return this.service.updateById(id, {
      estado: dto.estado,
      tiempo: dto.tiempo ? new Date(dto.tiempo) : undefined,
      empleadoId: dto.empleadoId,
    });
  }

  @Post('reconcile-unmatched')
  reconcileUnmatched(@Query('limit') limit?: string) {
    return this.service.reconcileUnmatched(limit ? Number(limit) : undefined);
  }
}
