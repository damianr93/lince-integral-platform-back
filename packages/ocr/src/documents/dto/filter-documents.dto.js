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
exports.FilterDocumentsDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const enums_1 = require("../../enums");
/**
 * GET /ocr/documents          → ADMIN / SUPERADMIN (todos los documentos)
 * GET /ocr/documents/me/facturas → ADMINISTRATIVO (solo sus facturas)
 * GET /ocr/documents/me/retenciones → ADMINISTRATIVO (solo sus retenciones)
 * GET /ocr/documents/review-queue → ADMIN / SUPERADMIN (cola de revisión)
 *
 * Todos los parámetros son opcionales.
 */
class FilterDocumentsDto {
    constructor() {
        /** Número de página (base 1) */
        this.page = 1;
        /** Documentos por página (máximo 100) */
        this.limit = 20;
    }
}
exports.FilterDocumentsDto = FilterDocumentsDto;
__decorate([
    (0, class_validator_1.IsEnum)(enums_1.DocumentType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FilterDocumentsDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(enums_1.DocumentStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FilterDocumentsDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FilterDocumentsDto.prototype, "uploadedBy", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FilterDocumentsDto.prototype, "dateFrom", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FilterDocumentsDto.prototype, "dateTo", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value, 10)),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], FilterDocumentsDto.prototype, "page", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value, 10)),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], FilterDocumentsDto.prototype, "limit", void 0);
//# sourceMappingURL=filter-documents.dto.js.map