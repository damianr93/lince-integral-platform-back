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
exports.RelevamientoItemEntity = void 0;
const typeorm_1 = require("typeorm");
const relevamiento_entity_1 = require("./relevamiento.entity");
let RelevamientoItemEntity = class RelevamientoItemEntity {
};
exports.RelevamientoItemEntity = RelevamientoItemEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], RelevamientoItemEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => relevamiento_entity_1.RelevamientoEntity, (r) => r.items, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'relevamientoId' }),
    __metadata("design:type", relevamiento_entity_1.RelevamientoEntity)
], RelevamientoItemEntity.prototype, "relevamiento", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], RelevamientoItemEntity.prototype, "relevamientoId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], RelevamientoItemEntity.prototype, "orden", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar' }),
    __metadata("design:type", String)
], RelevamientoItemEntity.prototype, "titulo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], RelevamientoItemEntity.prototype, "procedimiento", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], RelevamientoItemEntity.prototype, "observacion", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], RelevamientoItemEntity.prototype, "conclusion", void 0);
exports.RelevamientoItemEntity = RelevamientoItemEntity = __decorate([
    (0, typeorm_1.Entity)('soporte_it_relevamiento_items')
], RelevamientoItemEntity);
//# sourceMappingURL=relevamiento-item.entity.js.map