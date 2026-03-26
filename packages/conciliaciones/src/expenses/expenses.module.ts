import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpensesService } from './expenses.service';
import { ExpensesController } from './expenses.controller';
import { ExpenseCategoryEntity } from '../entities/expense-category.entity';
import { ExpenseRuleEntity } from '../entities/expense-rule.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ExpenseCategoryEntity, ExpenseRuleEntity])],
  controllers: [ExpensesController],
  providers: [ExpensesService],
})
export class ExpensesModule {}
