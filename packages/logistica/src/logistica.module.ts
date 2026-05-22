import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentEntity, StorageModule, UserEntity } from '@lince/database';
import { RemitosController } from './remitos/remitos.controller';
import { RemitosService } from './remitos/remitos.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([DocumentEntity, UserEntity]),
    StorageModule,
  ],
  controllers: [RemitosController],
  providers:   [RemitosService],
})
export class LogisticaModule {}
