import {
  Body, Controller, Delete, Get, Param, ParseUUIDPipe,
  Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@lince/auth';
import { EmployeesService } from './employees.service';
import { CreateEmpleadoDto } from './dto/create-empleado.dto';
import { UpdateEmpleadoDto } from './dto/update-empleado.dto';
import { Planta } from '../entities/empleado.entity';

@UseGuards(JwtAuthGuard)
@Controller('asistencia/empleados')
export class EmployeesController {
  constructor(private readonly service: EmployeesService) {}

  @Get()
  findAll(
    @Query('planta') planta?: Planta,
    @Query('soloActivos') soloActivos?: string,
  ) {
    return this.service.findAll(planta, soloActivos === 'true');
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post('seed-villa-nueva')
  seedVillaNueva() {
    return this.service.seedVillaNueva();
  }

  @Post()
  create(@Body() dto: CreateEmpleadoDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateEmpleadoDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
