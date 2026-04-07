import {
  Body,
  Controller,
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
import { RelevamientosService } from './relevamientos.service';
import { CreateRelevamientoDto } from './dto/create-relevamiento.dto';
import { UpdateRelevamientoDto } from './dto/update-relevamiento.dto';

@Controller('soporte-it/relevamientos')
@UseGuards(JwtAuthGuard, ModuleGuard, RolesGuard)
@RequireModule(ModuleKey.SOPORTE_IT)
export class RelevamientosController {
  constructor(private readonly relevamientosService: RelevamientosService) {}

  /** Obtener relevamiento por ID */
  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.relevamientosService.findOneForUser(id, user);
  }

  /** Obtener relevamiento de un incidente */
  @Get('incidente/:incidenteId')
  findByIncidente(
    @Param('incidenteId', ParseUUIDPipe) incidenteId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.relevamientosService.findByIncidenteForUser(incidenteId, user);
  }

  /** Crear relevamiento — solo SUPERADMIN */
  @Post()
  @Roles(GlobalRole.SUPERADMIN)
  create(
    @Body() dto: CreateRelevamientoDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.relevamientosService.create(dto, user);
  }

  /** Editar relevamiento — solo SUPERADMIN */
  @Patch(':id')
  @Roles(GlobalRole.SUPERADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRelevamientoDto,
  ) {
    return this.relevamientosService.update(id, dto);
  }
}
