import { ReconciliationRunEntity } from './reconciliation-run.entity';
import { ExtractLineEntity } from './extract-line.entity';
import { SystemLineEntity } from './system-line.entity';
export declare class MatchEntity {
    id: string;
    runId: string;
    run: ReconciliationRunEntity;
    extractLineId: string;
    extractLine: ExtractLineEntity;
    systemLineId: string;
    systemLine: SystemLineEntity;
    deltaDays: number;
}
//# sourceMappingURL=match.entity.d.ts.map