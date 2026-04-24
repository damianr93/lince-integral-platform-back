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
exports.IncidenteEntity = void 0;
const typeorm_1 = require("typeorm");
const database_1 = require("@lince/database");
const equipo_entity_1 = require("./equipo.entity");
const relevamiento_entity_1 = require("./relevamiento.entity");
let IncidenteEntity = class IncidenteEntity {
};
exports.IncidenteEntity = IncidenteEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], IncidenteEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], IncidenteEntity.prototype, "numeroReporte", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => equipo_entity_1.EquipoEntity, (e) => e.incidentes, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'equipoId' }),
    __metadata("design:type", equipo_entity_1.EquipoEntity)
], IncidenteEntity.prototype, "equipo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], IncidenteEntity.prototype, "equipoId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => database_1.UserEntity, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'reportadoPorId' }),
    __metadata("design:type", Object)
], IncidenteEntity.prototype, "reportadoPor", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], IncidenteEntity.prototype, "reportadoPorId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], IncidenteEntity.prototype, "descripcion", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', default: 'media' }),
    __metadata("design:type", String)
], IncidenteEntity.prototype, "urgencia", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', default: 'pending' }),
    __metadata("design:type", String)
], IncidenteEntity.prototype, "estado", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', default: () => 'NOW()' }),
    __metadata("design:type", Date)
], IncidenteEntity.prototype, "fechaReporte", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], IncidenteEntity.prototype, "aplicacionesAfectadas", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], IncidenteEntity.prototype, "accionesPrevias", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => relevamiento_entity_1.RelevamientoEntity, (r) => r.incidente, { nullable: true }),
    __metadata("design:type", Object)
], IncidenteEntity.prototype, "relevamiento", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], IncidenteEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], IncidenteEntity.prototype, "updatedAt", void 0);
exports.IncidenteEntity = IncidenteEntity = __decorate([
    (0, typeorm_1.Entity)('soporte_it_incidentes')
], IncidenteEntity);
//# sourceMappingURL=incidente.entity.js.map