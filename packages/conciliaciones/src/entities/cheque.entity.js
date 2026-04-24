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
exports.ChequeEntity = void 0;
const typeorm_1 = require("typeorm");
const enums_1 = require("../enums");
const reconciliation_run_entity_1 = require("./reconciliation-run.entity");
let ChequeEntity = class ChequeEntity {
};
exports.ChequeEntity = ChequeEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ChequeEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ChequeEntity.prototype, "runId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => reconciliation_run_entity_1.ReconciliationRunEntity, (r) => r.cheques, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'runId' }),
    __metadata("design:type", reconciliation_run_entity_1.ReconciliationRunEntity)
], ChequeEntity.prototype, "run", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], ChequeEntity.prototype, "number", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'timestamp' }),
    __metadata("design:type", Object)
], ChequeEntity.prototype, "issueDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'timestamp' }),
    __metadata("design:type", Object)
], ChequeEntity.prototype, "dueDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float' }),
    __metadata("design:type", Number)
], ChequeEntity.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: enums_1.ChequeStatus, default: enums_1.ChequeStatus.ISSUED }),
    __metadata("design:type", String)
], ChequeEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'text' }),
    __metadata("design:type", Object)
], ChequeEntity.prototype, "note", void 0);
exports.ChequeEntity = ChequeEntity = __decorate([
    (0, typeorm_1.Entity)('cheques')
], ChequeEntity);
//# sourceMappingURL=cheque.entity.js.map