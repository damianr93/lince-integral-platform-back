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
exports.ExpenseCategoryEntity = void 0;
const typeorm_1 = require("typeorm");
const expense_rule_entity_1 = require("./expense-rule.entity");
const extract_line_entity_1 = require("./extract-line.entity");
let ExpenseCategoryEntity = class ExpenseCategoryEntity {
};
exports.ExpenseCategoryEntity = ExpenseCategoryEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ExpenseCategoryEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], ExpenseCategoryEntity.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => expense_rule_entity_1.ExpenseRuleEntity, (r) => r.category, { cascade: true }),
    __metadata("design:type", Array)
], ExpenseCategoryEntity.prototype, "rules", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => extract_line_entity_1.ExtractLineEntity, (l) => l.category),
    __metadata("design:type", Array)
], ExpenseCategoryEntity.prototype, "lines", void 0);
exports.ExpenseCategoryEntity = ExpenseCategoryEntity = __decorate([
    (0, typeorm_1.Entity)('expense_categories')
], ExpenseCategoryEntity);
//# sourceMappingURL=expense-category.entity.js.map