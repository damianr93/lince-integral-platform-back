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
exports.ReconciliationRunEntity = void 0;
const typeorm_1 = require("typeorm");
const enums_1 = require("../enums");
const extract_line_entity_1 = require("./extract-line.entity");
const system_line_entity_1 = require("./system-line.entity");
const match_entity_1 = require("./match.entity");
const unmatched_extract_entity_1 = require("./unmatched-extract.entity");
const unmatched_system_entity_1 = require("./unmatched-system.entity");
const pending_item_entity_1 = require("./pending-item.entity");
const cheque_entity_1 = require("./cheque.entity");
const run_member_entity_1 = require("./run-member.entity");
const message_entity_1 = require("./message.entity");
const issue_entity_1 = require("./issue.entity");
let ReconciliationRunEntity = class ReconciliationRunEntity {
};
exports.ReconciliationRunEntity = ReconciliationRunEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ReconciliationRunEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], ReconciliationRunEntity.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], ReconciliationRunEntity.prototype, "bankName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], ReconciliationRunEntity.prototype, "accountRef", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], ReconciliationRunEntity.prototype, "windowDays", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'timestamp' }),
    __metadata("design:type", Object)
], ReconciliationRunEntity.prototype, "cutDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: enums_1.RunStatus, default: enums_1.RunStatus.OPEN }),
    __metadata("design:type", String)
], ReconciliationRunEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: () => "'[]'" }),
    __metadata("design:type", Array)
], ReconciliationRunEntity.prototype, "excludeConcepts", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: () => "'[]'" }),
    __metadata("design:type", Array)
], ReconciliationRunEntity.prototype, "enabledCategoryIds", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ReconciliationRunEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ReconciliationRunEntity.prototype, "createdById", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => extract_line_entity_1.ExtractLineEntity, (l) => l.run),
    __metadata("design:type", Array)
], ReconciliationRunEntity.prototype, "extractLines", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => system_line_entity_1.SystemLineEntity, (l) => l.run),
    __metadata("design:type", Array)
], ReconciliationRunEntity.prototype, "systemLines", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => match_entity_1.MatchEntity, (m) => m.run),
    __metadata("design:type", Array)
], ReconciliationRunEntity.prototype, "matches", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => unmatched_extract_entity_1.UnmatchedExtractEntity, (u) => u.run),
    __metadata("design:type", Array)
], ReconciliationRunEntity.prototype, "unmatchedExtract", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => unmatched_system_entity_1.UnmatchedSystemEntity, (u) => u.run),
    __metadata("design:type", Array)
], ReconciliationRunEntity.prototype, "unmatchedSystem", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => pending_item_entity_1.PendingItemEntity, (p) => p.run),
    __metadata("design:type", Array)
], ReconciliationRunEntity.prototype, "pendingItems", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => cheque_entity_1.ChequeEntity, (c) => c.run),
    __metadata("design:type", Array)
], ReconciliationRunEntity.prototype, "cheques", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => run_member_entity_1.RunMemberEntity, (m) => m.run),
    __metadata("design:type", Array)
], ReconciliationRunEntity.prototype, "members", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => message_entity_1.MessageEntity, (m) => m.run),
    __metadata("design:type", Array)
], ReconciliationRunEntity.prototype, "messages", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => issue_entity_1.IssueEntity, (i) => i.run),
    __metadata("design:type", Array)
], ReconciliationRunEntity.prototype, "issues", void 0);
exports.ReconciliationRunEntity = ReconciliationRunEntity = __decorate([
    (0, typeorm_1.Entity)('reconciliation_runs')
], ReconciliationRunEntity);
//# sourceMappingURL=reconciliation-run.entity.js.map