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
exports.SystemLineEntity = void 0;
const typeorm_1 = require("typeorm");
const bigint_transformer_1 = require("./bigint.transformer");
const reconciliation_run_entity_1 = require("./reconciliation-run.entity");
const match_entity_1 = require("./match.entity");
const unmatched_system_entity_1 = require("./unmatched-system.entity");
const pending_item_entity_1 = require("./pending-item.entity");
let SystemLineEntity = class SystemLineEntity {
};
exports.SystemLineEntity = SystemLineEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SystemLineEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SystemLineEntity.prototype, "runId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => reconciliation_run_entity_1.ReconciliationRunEntity, (r) => r.systemLines, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'runId' }),
    __metadata("design:type", reconciliation_run_entity_1.ReconciliationRunEntity)
], SystemLineEntity.prototype, "run", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Object)
], SystemLineEntity.prototype, "rowIndex", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'timestamp' }),
    __metadata("design:type", Object)
], SystemLineEntity.prototype, "issueDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'timestamp' }),
    __metadata("design:type", Object)
], SystemLineEntity.prototype, "dueDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float' }),
    __metadata("design:type", Number)
], SystemLineEntity.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', transformer: bigint_transformer_1.bigintTransformer }),
    __metadata("design:type", Number)
], SystemLineEntity.prototype, "amountKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], SystemLineEntity.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb' }),
    __metadata("design:type", Object)
], SystemLineEntity.prototype, "raw", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => match_entity_1.MatchEntity, (m) => m.systemLine),
    __metadata("design:type", Array)
], SystemLineEntity.prototype, "matchLines", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => unmatched_system_entity_1.UnmatchedSystemEntity, (u) => u.systemLine),
    __metadata("design:type", Object)
], SystemLineEntity.prototype, "unmatched", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => pending_item_entity_1.PendingItemEntity, (p) => p.systemLine),
    __metadata("design:type", Array)
], SystemLineEntity.prototype, "pendingItems", void 0);
exports.SystemLineEntity = SystemLineEntity = __decorate([
    (0, typeorm_1.Entity)('system_lines')
], SystemLineEntity);
//# sourceMappingURL=system-line.entity.js.map