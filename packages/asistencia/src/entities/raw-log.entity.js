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
exports.RawLogEntity = void 0;
const typeorm_1 = require("typeorm");
let RawLogEntity = class RawLogEntity {
};
exports.RawLogEntity = RawLogEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], RawLogEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], RawLogEntity.prototype, "method", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], RawLogEntity.prototype, "path", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], RawLogEntity.prototype, "headers", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'query_params', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], RawLogEntity.prototype, "queryParams", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'body_raw', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], RawLogEntity.prototype, "bodyRaw", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'body_parsed', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], RawLogEntity.prototype, "bodyParsed", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'device_sn', nullable: true, type: 'varchar' }),
    __metadata("design:type", Object)
], RawLogEntity.prototype, "deviceSn", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ip', nullable: true, type: 'varchar' }),
    __metadata("design:type", Object)
], RawLogEntity.prototype, "ip", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], RawLogEntity.prototype, "createdAt", void 0);
exports.RawLogEntity = RawLogEntity = __decorate([
    (0, typeorm_1.Entity)('asistencia_raw_logs')
], RawLogEntity);
//# sourceMappingURL=raw-log.entity.js.map