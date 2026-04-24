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
exports.RelevamientoEntity = void 0;
const typeorm_1 = require("typeorm");
const database_1 = require("@lince/database");
const incidente_entity_1 = require("./incidente.entity");
const relevamiento_item_entity_1 = require("./relevamiento-item.entity");
let RelevamientoEntity = class RelevamientoEntity {
};
exports.RelevamientoEntity = RelevamientoEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], RelevamientoEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => incidente_entity_1.IncidenteEntity, (i) => i.relevamiento, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'incidenteId' }),
    __metadata("design:type", incidente_entity_1.IncidenteEntity)
], RelevamientoEntity.prototype, "incidente", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], RelevamientoEntity.prototype, "incidenteId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => database_1.UserEntity, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'creadoPorId' }),
    __metadata("design:type", Object)
], RelevamientoEntity.prototype, "creadoPor", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], RelevamientoEntity.prototype, "creadoPorId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', default: () => 'CURRENT_DATE' }),
    __metadata("design:type", String)
], RelevamientoEntity.prototype, "fecha", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], RelevamientoEntity.prototype, "modalidad", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], RelevamientoEntity.prototype, "conclusionGeneral", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], RelevamientoEntity.prototype, "pasosASeguir", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], RelevamientoEntity.prototype, "recomendaciones", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => relevamiento_item_entity_1.RelevamientoItemEntity, (item) => item.relevamiento, {
        cascade: true,
        eager: false,
    }),
    __metadata("design:type", Array)
], RelevamientoEntity.prototype, "items", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], RelevamientoEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], RelevamientoEntity.prototype, "updatedAt", void 0);
exports.RelevamientoEntity = RelevamientoEntity = __decorate([
    (0, typeorm_1.Entity)('soporte_it_relevamientos')
], RelevamientoEntity);
//# sourceMappingURL=relevamiento.entity.js.map