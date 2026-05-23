import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard, ModuleGuard, RequireModule } from '@lince/auth';
import { ModuleKey } from '@lince/types';
import { GeoLayersService } from './geo-layers.service';
import { UpsertGeoPointDto } from './dto/upsert-geo-point.dto';

@Controller('logistica/geo-layers')
@UseGuards(JwtAuthGuard, ModuleGuard)
@RequireModule(ModuleKey.LOGISTICA)
export class GeoLayersController {
  constructor(private readonly service: GeoLayersService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  create(@Body() dto: UpsertGeoPointDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<UpsertGeoPointDto>,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
