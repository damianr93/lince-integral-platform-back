import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentEntity } from '../entities/document.entity';
import { OcrConfigEntity } from '../entities/ocr-config.entity';
import { StorageModule } from '../storage/storage.module';
import { VisionModule } from '../vision/vision.module';
import { ValidationService } from '../validation/validation.service';
import { OcrNotificationsModule } from '../notifications/notifications.module';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([DocumentEntity, OcrConfigEntity]),
    StorageModule,
    VisionModule,
    OcrNotificationsModule,
  ],
  providers:   [DocumentsService, ValidationService],
  // VisionService ya está provisto por VisionModule (importado arriba)
  controllers: [DocumentsController],
  exports:     [DocumentsService, ValidationService],
})
export class DocumentsModule {}
