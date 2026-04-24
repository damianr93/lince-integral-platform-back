"use strict";
/**
 * DocumentsController — /ocr/documents
 *
 * Endpoints públicos del módulo OCR.
 * Todos requieren autenticación JWT + módulo OCR habilitado.
 *
 * Permisos por endpoint:
 *
 *  POST   /upload-url         → OPERADOR_CAMPO (remitos), ADMINISTRATIVO (facturas), ADMIN/SUPERADMIN
 *  POST   /confirm-upload     → El que subió el documento
 *  GET    /                   → Solo ADMIN / SUPERADMIN
 *  GET    /facturas            → ADMINISTRATIVO (solo las propias)
 *  GET    /retenciones        → ADMINISTRATIVO (solo las propias)
 *  GET    /review-queue       → Solo ADMIN / SUPERADMIN
 *  GET    /:id                → El dueño del doc, ADMIN, SUPERADMIN
 *  GET    /:id/status         → El dueño del doc, ADMIN, SUPERADMIN (polling liviano)
 *  PATCH  /:id                → ADMINISTRATIVO (sus facturas), ADMIN, SUPERADMIN
 *  PATCH  /:id/approve        → Solo ADMIN / SUPERADMIN
 *  PATCH  /:id/reject         → Solo ADMIN / SUPERADMIN
 *  DELETE /:id                → Solo ADMIN / SUPERADMIN
 *
 * Configuración (solo SUPERADMIN):
 *  GET    /config             → Ver campos requeridos por tipo
 *  PATCH  /config/:type       → Actualizar campos requeridos
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentsController = void 0;
const common_1 = require("@nestjs/common");
const auth_1 = require("@lince/auth");
const types_1 = require("@lince/types");
const documents_service_1 = require("./documents.service");
const validation_service_1 = require("../validation/validation.service");
const confirm_upload_dto_1 = require("./dto/confirm-upload.dto");
const filter_documents_dto_1 = require("./dto/filter-documents.dto");
const request_upload_url_dto_1 = require("./dto/request-upload-url.dto");
const approve_reject_dto_1 = require("./dto/approve-reject.dto");
const update_document_dto_1 = require("./dto/update-document.dto");
const enums_1 = require("../enums");
const class_validator_1 = require("class-validator");
// ── DTO inline para config ────────────────────────────────────────────────────
class UpdateOcrConfigDto {
}
__decorate([
    (0, class_validator_1.IsEnum)(enums_1.DocumentType),
    __metadata("design:type", String)
], UpdateOcrConfigDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Array)
], UpdateOcrConfigDto.prototype, "requiredFields", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], UpdateOcrConfigDto.prototype, "fieldLabels", void 0);
// ── Guards base para todos los endpoints ─────────────────────────────────────
let DocumentsController = class DocumentsController {
    constructor(documents, validation) {
        this.documents = documents;
        this.validation = validation;
    }
    // ── Upload flow ────────────────────────────────────────────────────────────
    /**
     * Solicitar presigned URL para subir un documento a S3.
     * El cliente recibe: { documentId, uploadUrl, s3Key, expiresIn }
     * Debe hacer: PUT <uploadUrl> con el archivo binario y Content-Type correcto.
     */
    requestUploadUrl(dto, user) {
        return this.documents.requestUploadUrl(dto, user);
    }
    /**
     * Confirmar que el archivo ya fue subido a S3.
     * Dispara el procesamiento OCR de forma asíncrona.
     * El cliente puede hacer polling en GET /:id/status para seguir el progreso.
     */
    confirmUpload(dto, user) {
        return this.documents.confirmUpload(dto, user);
    }
    // ── Consultas ──────────────────────────────────────────────────────────────
    /**
     * Lista todos los documentos del sistema con filtros.
     * Solo ADMIN / SUPERADMIN.
     */
    findAll(filters) {
        return this.documents.findAll(filters);
    }
    /**
     * Lista las facturas propias del ADMINISTRATIVO autenticado.
     */
    findMyFacturas(filters, user) {
        return this.documents.findMyFacturas(filters, user.id);
    }
    /**
     * Lista las retenciones propias del ADMINISTRATIVO autenticado.
     */
    findMyRetenciones(filters, user) {
        return this.documents.findMyRetenciones(filters, user.id);
    }
    /**
     * Cola de revisión — documentos que requieren atención del ADMIN.
     * Solo ADMIN / SUPERADMIN.
     */
    findReviewQueue(filters) {
        return this.documents.findReviewQueue(filters);
    }
    /**
     * Obtiene una presigned GET URL fresca para visualizar el archivo original.
     * Útil cuando la URL del findOne expiró o vino nula por un error de S3.
     */
    getViewUrl(id, user) {
        return this.documents.getViewUrl(id, user);
    }
    /**
     * Polling de estado — endpoint liviano, devuelve solo id + status + errores.
     */
    getStatus(id, user) {
        return this.documents.getStatus(id, user);
    }
    /**
     * Detalle completo de un documento, incluye presigned view URL para la imagen.
     */
    findOne(id, user) {
        return this.documents.findOne(id, user);
    }
    // ── Corrección y revisión ──────────────────────────────────────────────────
    /**
     * Corregir campos extraídos por OCR.
     * Después de guardar, re-valida y actualiza el estado.
     */
    updateFields(id, dto, user) {
        return this.documents.updateFields(id, dto, user);
    }
    /**
     * Aprobar un documento. Solo ADMIN / SUPERADMIN.
     */
    approve(id, _dto, user) {
        return this.documents.approve(id, user);
    }
    /**
     * Rechazar un documento. Solo ADMIN / SUPERADMIN.
     */
    reject(id, dto, user) {
        return this.documents.reject(id, dto, user);
    }
    /**
     * Eliminar un documento. Solo ADMIN / SUPERADMIN.
     * Borra de DB y de S3 (si está configurado).
     */
    deleteDocument(id, user) {
        return this.documents.deleteDocument(id, user);
    }
    // ── Configuración (SUPERADMIN) ─────────────────────────────────────────────
    /**
     * Ver configuración actual de campos requeridos por tipo de documento.
     */
    getConfigs() {
        return this.validation.getAllConfigs();
    }
    /**
     * Actualizar campos requeridos para un tipo de documento.
     */
    updateConfig(dto) {
        return this.validation.upsertConfig(dto.type, dto.requiredFields, dto.fieldLabels);
    }
};
exports.DocumentsController = DocumentsController;
__decorate([
    (0, common_1.Post)('upload-url'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, auth_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [request_upload_url_dto_1.RequestUploadUrlDto, Object]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "requestUploadUrl", null);
__decorate([
    (0, common_1.Post)('confirm-upload'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, auth_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [confirm_upload_dto_1.ConfirmUploadDto, Object]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "confirmUpload", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [filter_documents_dto_1.FilterDocumentsDto]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('facturas'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, auth_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [filter_documents_dto_1.FilterDocumentsDto, Object]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "findMyFacturas", null);
__decorate([
    (0, common_1.Get)('retenciones'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, auth_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [filter_documents_dto_1.FilterDocumentsDto, Object]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "findMyRetenciones", null);
__decorate([
    (0, common_1.Get)('review-queue'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [filter_documents_dto_1.FilterDocumentsDto]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "findReviewQueue", null);
__decorate([
    (0, common_1.Get)(':id/view-url'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, auth_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "getViewUrl", null);
__decorate([
    (0, common_1.Get)(':id/status'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, auth_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, auth_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, auth_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_document_dto_1.UpdateDocumentDto, Object]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "updateFields", null);
__decorate([
    (0, common_1.Patch)(':id/approve'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, auth_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, approve_reject_dto_1.ApproveDocumentDto, Object]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "approve", null);
__decorate([
    (0, common_1.Patch)(':id/reject'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, auth_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, approve_reject_dto_1.RejectDocumentDto, Object]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "reject", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, auth_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "deleteDocument", null);
__decorate([
    (0, common_1.UseGuards)(auth_1.RolesGuard),
    (0, auth_1.Roles)(types_1.GlobalRole.SUPERADMIN),
    (0, common_1.Get)('config/all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "getConfigs", null);
__decorate([
    (0, common_1.UseGuards)(auth_1.RolesGuard),
    (0, auth_1.Roles)(types_1.GlobalRole.SUPERADMIN),
    (0, common_1.Patch)('config/update'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UpdateOcrConfigDto]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "updateConfig", null);
exports.DocumentsController = DocumentsController = __decorate([
    (0, common_1.UseGuards)(auth_1.JwtAuthGuard, auth_1.ModuleGuard),
    (0, auth_1.RequireModule)(types_1.ModuleKey.OCR),
    (0, common_1.Controller)('ocr/documents'),
    __metadata("design:paramtypes", [documents_service_1.DocumentsService,
        validation_service_1.ValidationService])
], DocumentsController);
//# sourceMappingURL=documents.controller.js.map