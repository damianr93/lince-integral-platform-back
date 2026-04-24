import { ReconciliationRunEntity } from './reconciliation-run.entity';
import { ExpenseCategoryEntity } from './expense-category.entity';
import { MatchEntity } from './match.entity';
import { UnmatchedExtractEntity } from './unmatched-extract.entity';
export declare class ExtractLineEntity {
    id: string;
    runId: string;
    run: ReconciliationRunEntity;
    date: Date | null;
    concept: string | null;
    amount: number;
    amountKey: number;
    raw: Record<string, unknown>;
    categoryId: string | null;
    category: ExpenseCategoryEntity | null;
    excluded: boolean;
    matchLines: MatchEntity[];
    unmatched: UnmatchedExtractEntity | null;
}
//# sourceMappingURL=extract-line.entity.d.ts.map