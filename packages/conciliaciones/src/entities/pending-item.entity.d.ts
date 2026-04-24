import { PendingStatus } from '../enums';
import { ReconciliationRunEntity } from './reconciliation-run.entity';
import { SystemLineEntity } from './system-line.entity';
export declare class PendingItemEntity {
    id: string;
    runId: string;
    run: ReconciliationRunEntity;
    area: string;
    status: PendingStatus;
    resolvedAt: Date | null;
    note: string | null;
    systemLineId: string | null;
    systemLine: SystemLineEntity | null;
}
//# sourceMappingURL=pending-item.entity.d.ts.map