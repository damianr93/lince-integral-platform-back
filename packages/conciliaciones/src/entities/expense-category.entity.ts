import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ExpenseRuleEntity } from './expense-rule.entity';
import { ExtractLineEntity } from './extract-line.entity';

@Entity('expense_categories')
export class ExpenseCategoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @OneToMany(() => ExpenseRuleEntity, (r) => r.category, { cascade: true })
  rules: ExpenseRuleEntity[];

  @OneToMany(() => ExtractLineEntity, (l) => l.category)
  lines: ExtractLineEntity[];
}
