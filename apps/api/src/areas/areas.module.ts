import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AreaEntity } from '@lince/database';
import { AreasController } from './areas.controller';
import { AreasService } from './areas.service';

@Module({
  imports: [TypeOrmModule.forFeature([AreaEntity])],
  controllers: [AreasController],
  providers: [AreasService],
})
export class AreasModule {}
