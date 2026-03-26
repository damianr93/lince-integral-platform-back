import { BadRequestException, Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, ModuleGuard, RequireModule } from '@lince/auth';
import { ModuleKey } from '@lince/types';
import { GeoService } from './geo.service';

@Controller('crm/geo')
@UseGuards(JwtAuthGuard, ModuleGuard)
@RequireModule(ModuleKey.CRM)
export class GeoController {
  constructor(private readonly geoService: GeoService) {}

  @Get('search')
  async search(@Query('q') query?: string, @Query('limit') limit?: string) {
    const trimmed = query?.trim();
    if (!trimmed || trimmed.length < 3) {
      throw new BadRequestException('La búsqueda debe tener al menos 3 caracteres');
    }
    const parsedLimit = limit ? Number(limit) : 6;
    return this.geoService.search(trimmed, Number.isFinite(parsedLimit) ? parsedLimit : 6);
  }

  @Get('argentina-provinces')
  async argentinaProvinces() {
    return this.geoService.argentinaProvincesGeoJson();
  }
}
