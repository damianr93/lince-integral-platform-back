export { OcrModule } from './ocr.module';
export { DocumentEntity } from './entities/document.entity';
export { OcrConfigEntity } from './entities/ocr-config.entity';
export { DocumentStatus, DocumentType, OcrRole } from './enums';
export { DocumentsService } from './documents/documents.service';
export { ValidationService } from './validation/validation.service';
export { StorageService } from './storage/storage.service';
import { DocumentEntity } from './entities/document.entity';
import { OcrConfigEntity } from './entities/ocr-config.entity';
export declare const ocrEntities: (typeof DocumentEntity | typeof OcrConfigEntity)[];
//# sourceMappingURL=index.d.ts.map