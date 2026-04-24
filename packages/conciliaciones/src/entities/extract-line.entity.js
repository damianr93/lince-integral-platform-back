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
exports.ExtractLineEntity = void 0;
const typeorm_1 = require("typeorm");
const bigint_transformer_1 = require("./bigint.transformer");
const reconciliation_run_entity_1 = require("./reconciliation-run.entity");
const expense_category_entity_1 = require("./expense-category.entity");
const match_entity_1 = require("./match.entity");
const unmatched_extract_entity_1 = require("./unmatched-extract.entity");
let ExtractLineEntity = class ExtractLineEntity {
};
exports.ExtractLineEntity = ExtractLineEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ExtractLineEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ExtractLineEntity.prototype, "runId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => reconciliation_run_entity_1.ReconciliationRunEntity, (r) => r.extractLines, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'runId' }),
    __metadata("design:type", reconciliation_run_entity_1.ReconciliationRunEntity)
], ExtractLineEntity.prototype, "run", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'timestamp' }),
    __metadata("design:type", Object)
], ExtractLineEntity.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], ExtractLineEntity.prototype, "concept", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float' }),
    __metadata("design:type", Number)
], ExtractLineEntity.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', transformer: bigint_transformer_1.bigintTransformer }),
    __metadata("design:type", Number)
], ExtractLineEntity.prototype, "amountKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb' }),
    __metadata("design:type", Object)
], ExtractLineEntity.prototype, "raw", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], ExtractLineEntity.prototype, "categoryId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => expense_category_entity_1.ExpenseCategoryEntity, (c) => c.lines, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'categoryId' }),
    __metadata("design:type", Object)
], ExtractLineEntity.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], ExtractLineEntity.prototype, "excluded", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => match_entity_1.MatchEntity, (m) => m.extractLine),
    __metadata("design:type", Array)
], ExtractLineEntity.prototype, "matchLines", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => unmatched_extract_entity_1.UnmatchedExtractEntity, (u) => u.extractLine),
    __metadata("design:type", Object)
], ExtractLineEntity.prototype, "unmatched", void 0);
exports.ExtractLineEntity = ExtractLineEntity = __decorate([
    (0, typeorm_1.Entity)('extract_lines')
], ExtractLineEntity);
//# sourceMappingURL=extract-line.entity.js.map