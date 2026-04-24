import { ReconciliationRunEntity } from './reconciliation-run.entity';
import { MatchEntity } from './match.entity';
import { UnmatchedSystemEntity } from './unmatched-system.entity';
import { PendingItemEntity } from './pending-item.entity';
export declare class SystemLineEntity {
    id: string;
    runId: string;
    run: ReconciliationRunEntity;
    rowIndex: number | null;
    issueDate: Date | null;
    dueDate: Date | null;
    amount: number;
    amountKey: number;
    description: string | null;
    raw: Record<string, unknown>;
    matchLines: MatchEntity[];
    unmatched: UnmatchedSystemEntity | null;
    pendingItems: PendingItemEntity[];
}
//# sourceMappingURL=system-line.entity.d.ts.map