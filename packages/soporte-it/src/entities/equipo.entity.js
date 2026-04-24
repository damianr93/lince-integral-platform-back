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
exports.EquipoEntity = void 0;
const typeorm_1 = require("typeorm");
const database_1 = require("@lince/database");
const incidente_entity_1 = require("./incidente.entity");
let EquipoEntity = class EquipoEntity {
};
exports.EquipoEntity = EquipoEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], EquipoEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Object)
], EquipoEntity.prototype, "numeroActivo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], EquipoEntity.prototype, "aCargoDe", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], EquipoEntity.prototype, "sector", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], EquipoEntity.prototype, "hostname", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], EquipoEntity.prototype, "windowsUserId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], EquipoEntity.prototype, "fabricante", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], EquipoEntity.prototype, "modelo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], EquipoEntity.prototype, "ramGb", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], EquipoEntity.prototype, "sistemaOperativo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], EquipoEntity.prototype, "procesador", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], EquipoEntity.prototype, "firmwareUefi", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], EquipoEntity.prototype, "graficos", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], EquipoEntity.prototype, "almacenamiento", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], EquipoEntity.prototype, "adaptadorRed", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], EquipoEntity.prototype, "ipv6", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], EquipoEntity.prototype, "controladorUsbHost", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', default: 'activo' }),
    __metadata("design:type", String)
], EquipoEntity.prototype, "estado", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], EquipoEntity.prototype, "notas", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => database_1.UserEntity, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'usuarioPlatId' }),
    __metadata("design:type", Object)
], EquipoEntity.prototype, "usuarioPlat", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], EquipoEntity.prototype, "usuarioPlatId", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => incidente_entity_1.IncidenteEntity, (inc) => inc.equipo),
    __metadata("design:type", Array)
], EquipoEntity.prototype, "incidentes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], EquipoEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], EquipoEntity.prototype, "updatedAt", void 0);
exports.EquipoEntity = EquipoEntity = __decorate([
    (0, typeorm_1.Entity)('soporte_it_equipos')
], EquipoEntity);
//# sourceMappingURL=equipo.entity.js.map