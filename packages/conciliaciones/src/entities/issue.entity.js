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
exports.IssueEntity = void 0;
const typeorm_1 = require("typeorm");
const reconciliation_run_entity_1 = require("./reconciliation-run.entity");
const issue_comment_entity_1 = require("./issue-comment.entity");
let IssueEntity = class IssueEntity {
};
exports.IssueEntity = IssueEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], IssueEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], IssueEntity.prototype, "runId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => reconciliation_run_entity_1.ReconciliationRunEntity, (r) => r.issues, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'runId' }),
    __metadata("design:type", reconciliation_run_entity_1.ReconciliationRunEntity)
], IssueEntity.prototype, "run", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], IssueEntity.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'text' }),
    __metadata("design:type", Object)
], IssueEntity.prototype, "body", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], IssueEntity.prototype, "createdById", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], IssueEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], IssueEntity.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => issue_comment_entity_1.IssueCommentEntity, (c) => c.issue, { cascade: true }),
    __metadata("design:type", Array)
], IssueEntity.prototype, "comments", void 0);
exports.IssueEntity = IssueEntity = __decorate([
    (0, typeorm_1.Entity)('recon_issues')
], IssueEntity);
//# sourceMappingURL=issue.entity.js.map