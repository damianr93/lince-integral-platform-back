import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExpenseCategoryEntity } from '../entities/expense-category.entity';
import { ExpenseRuleEntity } from '../entities/expense-rule.entity';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(ExpenseCategoryEntity)
    private categoryRepo: Repository<ExpenseCategoryEntity>,
    @InjectRepository(ExpenseRuleEntity)
    private ruleRepo: Repository<ExpenseRuleEntity>,
  ) {}

  listCategories() {
    return this.categoryRepo.find({
      relations: { rules: true },
      order: { name: 'ASC' },
    });
  }

  createCategory(name: string) {
    return this.categoryRepo.save(this.categoryRepo.create({ name }));
  }

  async deleteCategory(id: string) {
    await this.categoryRepo.delete({ id });
    return { deleted: true };
  }

  createRule(data: {
    categoryId: string;
    pattern: string;
    isRegex?: boolean;
    caseSensitive?: boolean;
  }) {
    return this.ruleRepo.save(
      this.ruleRepo.create({
        categoryId: data.categoryId,
        pattern: data.pattern,
        isRegex: data.isRegex ?? false,
        caseSensitive: data.caseSensitive ?? false,
      }),
    );
  }

  async deleteRule(id: string) {
    await this.ruleRepo.delete({ id });
    return { deleted: true };
  }
}
