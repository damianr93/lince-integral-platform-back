import { ExpenseCategoryEntity } from './expense-category.entity';
export declare class ExpenseRuleEntity {
    id: string;
    categoryId: string;
    category: ExpenseCategoryEntity;
    pattern: string;
    isRegex: boolean;
    caseSensitive: boolean;
}
//# sourceMappingURL=expense-rule.entity.d.ts.map