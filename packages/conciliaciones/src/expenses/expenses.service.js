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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpensesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const expense_category_entity_1 = require("../entities/expense-category.entity");
const expense_rule_entity_1 = require("../entities/expense-rule.entity");
let ExpensesService = class ExpensesService {
    constructor(categoryRepo, ruleRepo) {
        this.categoryRepo = categoryRepo;
        this.ruleRepo = ruleRepo;
    }
    listCategories() {
        return this.categoryRepo.find({
            relations: { rules: true },
            order: { name: 'ASC' },
        });
    }
    createCategory(name) {
        return this.categoryRepo.save(this.categoryRepo.create({ name }));
    }
    async deleteCategory(id) {
        await this.categoryRepo.delete({ id });
        return { deleted: true };
    }
    createRule(data) {
        return this.ruleRepo.save(this.ruleRepo.create({
            categoryId: data.categoryId,
            pattern: data.pattern,
            isRegex: data.isRegex ?? false,
            caseSensitive: data.caseSensitive ?? false,
        }));
    }
    async deleteRule(id) {
        await this.ruleRepo.delete({ id });
        return { deleted: true };
    }
};
exports.ExpensesService = ExpensesService;
exports.ExpensesService = ExpensesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(expense_category_entity_1.ExpenseCategoryEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(expense_rule_entity_1.ExpenseRuleEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], ExpensesService);
//# sourceMappingURL=expenses.service.js.map