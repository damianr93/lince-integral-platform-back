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
import { JwtAuthGuard, RolesGuard, Roles } from '@lince/auth';
import { GlobalRole, AreaDto } from '@lince/types';
import { AreasService } from './areas.service';
import { CreateAreaDto } from './dto/create-area.dto';
import { UpdateAreaDto } from './dto/update-area.dto';

@Controller('areas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AreasController {
  constructor(private readonly areasService: AreasService) {}

  /** Lista todas las áreas — SUPERADMIN y ADMIN */
  @Get()
  @Roles(GlobalRole.SUPERADMIN, GlobalRole.ADMIN)
  findAll(): Promise<AreaDto[]> {
    return this.areasService.findAll();
  }

  /** Crear área — solo SUPERADMIN */
  @Post()
  @Roles(GlobalRole.SUPERADMIN)
  create(@Body() dto: CreateAreaDto): Promise<AreaDto> {
    return this.areasService.create(dto);
  }

  /** Actualizar área — solo SUPERADMIN */
  @Patch(':id')
  @Roles(GlobalRole.SUPERADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAreaDto,
  ): Promise<AreaDto> {
    return this.areasService.update(id, dto);
  }

  /** Eliminar área — solo SUPERADMIN */
  @Delete(':id')
  @Roles(GlobalRole.SUPERADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.areasService.remove(id);
  }
}
