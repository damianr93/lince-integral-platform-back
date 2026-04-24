import { UnmatchedSystemStatus } from '../enums';
import { ReconciliationRunEntity } from './reconciliation-run.entity';
import { SystemLineEntity } from './system-line.entity';
export declare class UnmatchedSystemEntity {
    id: string;
    runId: string;
    run: ReconciliationRunEntity;
    systemLineId: string;
    systemLine: SystemLineEntity;
    status: UnmatchedSystemStatus;
}
//# sourceMappingURL=unmatched-system.entity.d.ts.map