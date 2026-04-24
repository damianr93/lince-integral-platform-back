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
exports.OcrConfigEntity = void 0;
const typeorm_1 = require("typeorm");
const enums_1 = require("../enums");
/**
 * Configuración de campos requeridos por tipo de documento.
 * SUPERADMIN puede modificar qué campos son obligatorios para cada tipo.
 *
 * Una fila por DocumentType. Se inicializa con valores por defecto en el seed.
 */
let OcrConfigEntity = class OcrConfigEntity {
};
exports.OcrConfigEntity = OcrConfigEntity;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'enum', enum: enums_1.DocumentType }),
    __metadata("design:type", String)
], OcrConfigEntity.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'required_fields', type: 'jsonb' }),
    __metadata("design:type", Array)
], OcrConfigEntity.prototype, "requiredFields", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'field_labels', type: 'jsonb', default: '{}' }),
    __metadata("design:type", Object)
], OcrConfigEntity.prototype, "fieldLabels", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], OcrConfigEntity.prototype, "updatedAt", void 0);
exports.OcrConfigEntity = OcrConfigEntity = __decorate([
    (0, typeorm_1.Entity)('ocr_config')
], OcrConfigEntity);
//# sourceMappingURL=ocr-config.entity.js.map