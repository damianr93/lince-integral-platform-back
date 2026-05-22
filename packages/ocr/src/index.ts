// Módulo raíz
export { OcrModule } from './ocr.module';

// Entidades TypeORM — DocumentEntity ahora vive en @lince/database
import { DocumentEntity } from '@lince/database';
export { DocumentEntity };
export { OcrConfigEntity } from './entities/ocr-config.entity';

// Enums — re-exportados desde @lince/types
import { DocumentStatus, DocumentType, OcrRole } from '@lince/types';
export { DocumentStatus, DocumentType, OcrRole };

// Services
export { DocumentsService } from './documents/documents.service';
export { ValidationService } from './validation/validation.service';
import { StorageService } from '@lince/database';
export { StorageService };

// Array listo para usar en buildDataSourceOptions() y data-source.ts
import { OcrConfigEntity } from './entities/ocr-config.entity';
export const ocrEntities = [DocumentEntity, OcrConfigEntity];
