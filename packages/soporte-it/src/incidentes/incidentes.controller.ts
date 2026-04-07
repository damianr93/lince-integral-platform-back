import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  CurrentUser,
  JwtAuthGuard,
  ModuleGuard,
  RequireModule,
  RolesGuard,
  Roles,
} from '@lince/auth';
import { AuthUser, GlobalRole, ModuleKey } from '@lince/types';
import { IncidentesService } from './incidentes.service';
import { CreateIncidenteDto } from './dto/create-incidente.dto';
import { UpdateIncidenteDto } from './dto/update-incidente.dto';

@Controller('soporte-it/incidentes')
@UseGuards(JwtAuthGuard, ModuleGuard)
@RequireModule(ModuleKey.SOPORTE_IT)
export class IncidentesController {
  constructor(private readonly incidentesService: IncidentesService) {}

  /** Lista todos los incidentes — solo SUPERADMIN */
  @Get()
  @UseGuards(RolesGuard)
  @Roles(GlobalRole.SUPERADMIN)
  findAll() {
    return this.incidentesService.findAll();
  }

  /** Incidentes de los equipos del usuario autenticado */
  @Get('mis-incidentes')
  findMine(@CurrentUser() user: AuthUser) {
    return this.incidentesService.findByUsuario(user.id);
  }

  /** Incidentes de un equipo específico */
  @Get('equipo/:equipoId')
  findByEquipo(@Param('equipoId', ParseUUIDPipe) equipoId: string) {
    return this.incidentesService.findByEquipo(equipoId);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    const incidente = await this.incidentesService.findOne(id);
    if (user.globalRole !== GlobalRole.SUPERADMIN) {
      if (incidente.equipo?.usuarioPlatId !== user.id) {
        throw new ForbiddenException('No tenés acceso a este incidente');
      }
    }
    return incidente;
  }

  /** Reportar un nuevo incidente — cualquier usuario con acceso al módulo */
  @Post()
  create(
    @Body() dto: CreateIncidenteDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.incidentesService.create(dto, user);
  }

  /** Actualizar estado del incidente — solo SUPERADMIN */
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateIncidenteDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.incidentesService.update(id, dto, user);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.incidentesService.remove(id, user);
  }
}
