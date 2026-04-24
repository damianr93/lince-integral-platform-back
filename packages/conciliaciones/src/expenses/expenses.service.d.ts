import { Repository } from 'typeorm';
import { ExpenseCategoryEntity } from '../entities/expense-category.entity';
import { ExpenseRuleEntity } from '../entities/expense-rule.entity';
export declare class ExpensesService {
    private categoryRepo;
    private ruleRepo;
    constructor(categoryRepo: Repository<ExpenseCategoryEntity>, ruleRepo: Repository<ExpenseRuleEntity>);
    listCategories(): Promise<ExpenseCategoryEntity[]>;
    createCategory(name: string): Promise<ExpenseCategoryEntity>;
    deleteCategory(id: string): Promise<{
        deleted: boolean;
    }>;
    createRule(data: {
        categoryId: string;
        pattern: string;
        isRegex?: boolean;
        caseSensitive?: boolean;
    }): Promise<ExpenseRuleEntity>;
    deleteRule(id: string): Promise<{
        deleted: boolean;
    }>;
}
//# sourceMappingURL=expenses.service.d.ts.map