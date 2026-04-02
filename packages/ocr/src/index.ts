// Módulo raíz
export { OcrModule } from './ocr.module';

// Entidades TypeORM
export { DocumentEntity } from './entities/document.entity';
export { OcrConfigEntity } from './entities/ocr-config.entity';

// Enums
export { DocumentStatus, DocumentType, OcrRole } from './enums';

// Services
export { DocumentsService } from './documents/documents.service';
export { ValidationService } from './validation/validation.service';
export { StorageService } from './storage/storage.service';

// Array listo para usar en buildDataSourceOptions() y data-source.ts
import { DocumentEntity } from './entities/document.entity';
import { OcrConfigEntity } from './entities/ocr-config.entity';

export const ocrEntities = [DocumentEntity, OcrConfigEntity];
