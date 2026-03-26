import { Module } from '@nestjs/common';
import { ReconciliationsModule } from './reconciliations/reconciliations.module';
import { ExpensesModule } from './expenses/expenses.module';

@Module({
  imports: [ReconciliationsModule, ExpensesModule],
  exports: [ReconciliationsModule, ExpensesModule],
})
export class ConciliacionesModule {}
