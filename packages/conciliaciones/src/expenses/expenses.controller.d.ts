import { ExpensesService } from './expenses.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateRuleDto } from './dto/create-rule.dto';
export declare class ExpensesController {
    private service;
    constructor(service: ExpensesService);
    listCategories(): Promise<import("..").ExpenseCategoryEntity[]>;
    createCategory(dto: CreateCategoryDto): Promise<import("..").ExpenseCategoryEntity>;
    deleteCategory(id: string): Promise<{
        deleted: boolean;
    }>;
    createRule(dto: CreateRuleDto): Promise<import("..").ExpenseRuleEntity>;
    deleteRule(id: string): Promise<{
        deleted: boolean;
    }>;
}
//# sourceMappingURL=expenses.controller.d.ts.map