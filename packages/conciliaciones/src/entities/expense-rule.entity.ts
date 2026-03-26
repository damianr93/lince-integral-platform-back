import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, JoinColumn } from 'typeorm';
import { ExpenseCategoryEntity } from './expense-category.entity';

@Entity('expense_rules')
export class ExpenseRuleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  categoryId: string;

  @ManyToOne(() => ExpenseCategoryEntity, (c) => c.rules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'categoryId' })
  category: ExpenseCategoryEntity;

  @Column()
  pattern: string;

  @Column({ default: false })
  isRegex: boolean;

  @Column({ default: false })
  caseSensitive: boolean;
}
