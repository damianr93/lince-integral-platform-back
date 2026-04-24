import { RunMemberRole } from '../enums';
import { ReconciliationRunEntity } from './reconciliation-run.entity';
export declare class RunMemberEntity {
    id: string;
    runId: string;
    run: ReconciliationRunEntity;
    userId: string;
    role: RunMemberRole;
}
//# sourceMappingURL=run-member.entity.d.ts.map