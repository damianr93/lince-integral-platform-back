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
exports.FichajeEntity = exports.EstadoFichaje = void 0;
const typeorm_1 = require("typeorm");
const empleado_entity_1 = require("./empleado.entity");
var EstadoFichaje;
(function (EstadoFichaje) {
    EstadoFichaje[EstadoFichaje["ENTRADA"] = 0] = "ENTRADA";
    EstadoFichaje[EstadoFichaje["SALIDA"] = 1] = "SALIDA";
})(EstadoFichaje || (exports.EstadoFichaje = EstadoFichaje = {}));
let FichajeEntity = class FichajeEntity {
};
exports.FichajeEntity = FichajeEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], FichajeEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => empleado_entity_1.EmpleadoEntity, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'empleado_id' }),
    __metadata("design:type", Object)
], FichajeEntity.prototype, "empleado", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'empleado_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], FichajeEntity.prototype, "empleadoId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], FichajeEntity.prototype, "pin", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], FichajeEntity.prototype, "tiempo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], FichajeEntity.prototype, "estado", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'int' }),
    __metadata("design:type", Object)
], FichajeEntity.prototype, "verify", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'device_sn', nullable: true, type: 'varchar' }),
    __metadata("design:type", Object)
], FichajeEntity.prototype, "deviceSn", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: empleado_entity_1.Planta, nullable: true }),
    __metadata("design:type", Object)
], FichajeEntity.prototype, "planta", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'raw_payload', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], FichajeEntity.prototype, "rawPayload", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], FichajeEntity.prototype, "createdAt", void 0);
exports.FichajeEntity = FichajeEntity = __decorate([
    (0, typeorm_1.Entity)('asistencia_fichajes'),
    (0, typeorm_1.Index)(['pin', 'tiempo']),
    (0, typeorm_1.Index)(['planta', 'tiempo'])
], FichajeEntity);
//# sourceMappingURL=fichaje.entity.js.map