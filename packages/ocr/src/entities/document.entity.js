"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentEntity = void 0;
const typeorm_1 = require("typeorm");
const enums_1 = require("../enums");
/**
 * Tabla principal del módulo OCR.
 * Almacena metadatos de remitos y facturas.
 * El archivo binario vive en AWS S3 (s3Key).
 * Los campos extraídos por el engine OCR se guardan en extractedData (JSONB).
 */
let DocumentEntity = class DocumentEntity {
};
exports.DocumentEntity = DocumentEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], DocumentEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: enums_1.DocumentType }),
    __metadata("design:type", String)
], DocumentEntity.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: enums_1.DocumentStatus,
        default: enums_1.DocumentStatus.PENDIENTE,
    }),
    __metadata("design:type", String)
], DocumentEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'uploaded_by', type: 'uuid' }),
    __metadata("design:type", String)
], DocumentEntity.prototype, "uploadedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'uploaded_by_role', type: 'enum', enum: enums_1.OcrRole }),
    __metadata("design:type", String)
], DocumentEntity.prototype, "uploadedByRole", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 's3_key' }),
    __metadata("design:type", String)
], DocumentEntity.prototype, "s3Key", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 's3_thumbnail_key', nullable: true, type: 'varchar' }),
    __metadata("design:type", Object)
], DocumentEntity.prototype, "s3ThumbnailKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'extracted_data', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], DocumentEntity.prototype, "extractedData", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'validation_errors', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], DocumentEntity.prototype, "validationErrors", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'corrected_by', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], DocumentEntity.prototype, "correctedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'corrected_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], DocumentEntity.prototype, "correctedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reviewed_by', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], DocumentEntity.prototype, "reviewedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'approved_by', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], DocumentEntity.prototype, "approvedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'approved_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], DocumentEntity.prototype, "approvedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reject_reason', type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], DocumentEntity.prototype, "rejectReason", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], DocumentEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], DocumentEntity.prototype, "updatedAt", void 0);
exports.DocumentEntity = DocumentEntity = __decorate([
    (0, typeorm_1.Entity)('ocr_documents'),
    (0, typeorm_1.Index)(['uploadedBy']),
    (0, typeorm_1.Index)(['status']),
    (0, typeorm_1.Index)(['type', 'status'])
], DocumentEntity);
//# sourceMappingURL=document.entity.js.map