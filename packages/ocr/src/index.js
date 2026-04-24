"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ocrEntities = exports.StorageService = exports.ValidationService = exports.DocumentsService = exports.OcrRole = exports.DocumentType = exports.DocumentStatus = exports.OcrConfigEntity = exports.DocumentEntity = exports.OcrModule = void 0;
// Módulo raíz
var ocr_module_1 = require("./ocr.module");
Object.defineProperty(exports, "OcrModule", { enumerable: true, get: function () { return ocr_module_1.OcrModule; } });
// Entidades TypeORM
var document_entity_1 = require("./entities/document.entity");
Object.defineProperty(exports, "DocumentEntity", { enumerable: true, get: function () { return document_entity_1.DocumentEntity; } });
var ocr_config_entity_1 = require("./entities/ocr-config.entity");
Object.defineProperty(exports, "OcrConfigEntity", { enumerable: true, get: function () { return ocr_config_entity_1.OcrConfigEntity; } });
// Enums
var enums_1 = require("./enums");
Object.defineProperty(exports, "DocumentStatus", { enumerable: true, get: function () { return enums_1.DocumentStatus; } });
Object.defineProperty(exports, "DocumentType", { enumerable: true, get: function () { return enums_1.DocumentType; } });
Object.defineProperty(exports, "OcrRole", { enumerable: true, get: function () { return enums_1.OcrRole; } });
// Services
var documents_service_1 = require("./documents/documents.service");
Object.defineProperty(exports, "DocumentsService", { enumerable: true, get: function () { return documents_service_1.DocumentsService; } });
var validation_service_1 = require("./validation/validation.service");
Object.defineProperty(exports, "ValidationService", { enumerable: true, get: function () { return validation_service_1.ValidationService; } });
var storage_service_1 = require("./storage/storage.service");
Object.defineProperty(exports, "StorageService", { enumerable: true, get: function () { return storage_service_1.StorageService; } });
// Array listo para usar en buildDataSourceOptions() y data-source.ts
const document_entity_2 = require("./entities/document.entity");
const ocr_config_entity_2 = require("./entities/ocr-config.entity");
exports.ocrEntities = [document_entity_2.DocumentEntity, ocr_config_entity_2.OcrConfigEntity];
//# sourceMappingURL=index.js.map