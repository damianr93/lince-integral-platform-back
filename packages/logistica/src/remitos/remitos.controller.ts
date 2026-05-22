import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  Redirect,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard, ModuleGuard, RequireModule } from '@lince/auth';
import { ModuleKey } from '@lince/types';
import { RemitosService } from './remitos.service';
import { FilterRemitosDto } from './dto/filter-remitos.dto';

@Controller('logistica/remitos')
@UseGuards(JwtAuthGuard, ModuleGuard)
@RequireModule(ModuleKey.LOGISTICA)
export class RemitosController {
  constructor(private readonly remitosService: RemitosService) {}

  @Get()
  findAll(@Query() filters: FilterRemitosDto) {
    return this.remitosService.findAll(filters);
  }

  @Get('mapa')
  findMapa() {
    return this.remitosService.findMapa();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.remitosService.findOne(id);
  }

  @Get(':id/file')
  @Redirect()
  async downloadFile(@Param('id', ParseUUIDPipe) id: string) {
    const url = await this.remitosService.getDownloadUrl(id);
    return { url, statusCode: 302 };
  }
}
