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
exports.RequestUploadUrlDto = void 0;
const class_validator_1 = require("class-validator");
const enums_1 = require("../../enums");
const storage_service_1 = require("../../storage/storage.service");
/**
 * POST /ocr/documents/upload-url
 *
 * El cliente solicita una presigned URL para subir un documento directamente a S3.
 * El servidor genera la URL y un documentId (UUID) que el cliente deberá usar
 * en el paso siguiente (confirm-upload).
 */
class RequestUploadUrlDto {
}
exports.RequestUploadUrlDto = RequestUploadUrlDto;
__decorate([
    (0, class_validator_1.IsEnum)(enums_1.DocumentType),
    __metadata("design:type", String)
], RequestUploadUrlDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsIn)([...storage_service_1.ALLOWED_MIME_TYPES]),
    __metadata("design:type", String)
], RequestUploadUrlDto.prototype, "contentType", void 0);
//# sourceMappingURL=request-upload-url.dto.js.map