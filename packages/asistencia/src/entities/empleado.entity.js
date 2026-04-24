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
exports.EmpleadoEntity = exports.Planta = void 0;
const typeorm_1 = require("typeorm");
var Planta;
(function (Planta) {
    Planta["TUCUMAN"] = "tucuman";
    Planta["VILLA_NUEVA"] = "villa_nueva";
})(Planta || (exports.Planta = Planta = {}));
let EmpleadoEntity = class EmpleadoEntity {
};
exports.EmpleadoEntity = EmpleadoEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], EmpleadoEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'first_name' }),
    __metadata("design:type", String)
], EmpleadoEntity.prototype, "firstName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_name' }),
    __metadata("design:type", String)
], EmpleadoEntity.prototype, "lastName", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'varchar' }),
    __metadata("design:type", Object)
], EmpleadoEntity.prototype, "dni", void 0);
__decorate([
    (0, typeorm_1.Index)({ unique: true }),
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], EmpleadoEntity.prototype, "pin", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: Planta }),
    __metadata("design:type", String)
], EmpleadoEntity.prototype, "planta", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'varchar' }),
    __metadata("design:type", Object)
], EmpleadoEntity.prototype, "departamento", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'varchar' }),
    __metadata("design:type", Object)
], EmpleadoEntity.prototype, "cargo", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], EmpleadoEntity.prototype, "activo", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], EmpleadoEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], EmpleadoEntity.prototype, "updatedAt", void 0);
exports.EmpleadoEntity = EmpleadoEntity = __decorate([
    (0, typeorm_1.Entity)('asistencia_empleados')
], EmpleadoEntity);
//# sourceMappingURL=empleado.entity.js.map