import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GeoPointEntity } from '../entities/geo-point.entity';
import { GeoLayersController } from './geo-layers.controller';
import { GeoLayersService } from './geo-layers.service';

@Module({
  imports: [TypeOrmModule.forFeature([GeoPointEntity])],
  controllers: [GeoLayersController],
  providers: [GeoLayersService],
})
export class GeoLayersModule {}
