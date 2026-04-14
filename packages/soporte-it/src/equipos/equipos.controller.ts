import {
  Body,
  Controller,
  Delete,
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
import { EquiposService } from './equipos.service';
import { CreateEquipoDto } from './dto/create-equipo.dto';
import { UpdateEquipoDto } from './dto/update-equipo.dto';

@Controller('soporte-it/equipos')
@UseGuards(JwtAuthGuard, ModuleGuard)
@RequireModule(ModuleKey.SOPORTE_IT)
export class EquiposController {
  constructor(private readonly equiposService: EquiposService) {}

  /** Lista todos los equipos — solo SUPERADMIN */
  @Get()
  @UseGuards(RolesGuard)
  @Roles(GlobalRole.SUPERADMIN)
  findAll() {
    return this.equiposService.findAll();
  }

  /** Equipos asignados al usuario autenticado */
  @Get('mis-equipos')
  findMine(@CurrentUser() user: AuthUser) {
    return this.equiposService.findByUsuario(user.id);
  }

  /** Detalle de un equipo — SUPERADMIN ve cualquiera; usuario solo los suyos */
  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    const equipo = await this.equiposService.findOne(id);
    if (user.globalRole !== GlobalRole.SUPERADMIN) {
      if (equipo.usuarioPlatId !== user.id) {
        // TODO-4 [MEDIO]: Este return devuelve HTTP 200 con un objeto de error —
        // eso está mal. El cliente recibe "éxito" (200) pero con un mensaje de
        // denegación adentro. Cualquier frontend o herramienta que chequee el
        // status code va a pensar que la request funcionó.
        //
        // En HTTP, "acceso denegado" se representa con el código 403 Forbidden.
        // NestJS tiene una excepción para eso que podés importar de @nestjs/common.
        //
        // Tu tarea: reemplazá este return por el lanzamiento de la excepción
        // correcta. Fijate cómo se hace en otros controllers del proyecto
        // (pista: buscá ForbiddenException o NotFoundException como ejemplo
        // del patrón — ya están en uso en equipos.service.ts y en otros lados).
        return { message: 'Acceso denegado' };
      }
    }
    return equipo;
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(GlobalRole.SUPERADMIN)
  create(@Body() dto: CreateEquipoDto) {
    return this.equiposService.create(dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(GlobalRole.SUPERADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEquipoDto,
  ) {
    return this.equiposService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(GlobalRole.SUPERADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.equiposService.remove(id);
  }
}
