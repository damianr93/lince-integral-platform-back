import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentEntity, StorageModule, UserEntity } from '@lince/database';
import { RemitosController } from './remitos/remitos.controller';
import { RemitosService } from './remitos/remitos.service';
import { GeoLayersModule } from './geo-layers/geo-layers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DocumentEntity, UserEntity]),
    StorageModule,
    GeoLayersModule,
  ],
  controllers: [RemitosController],
  providers:   [RemitosService],
})
export class LogisticaModule {}
