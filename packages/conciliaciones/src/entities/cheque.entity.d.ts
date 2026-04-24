import { ChequeStatus } from '../enums';
import { ReconciliationRunEntity } from './reconciliation-run.entity';
export declare class ChequeEntity {
    id: string;
    runId: string;
    run: ReconciliationRunEntity;
    number: string | null;
    issueDate: Date | null;
    dueDate: Date | null;
    amount: number;
    status: ChequeStatus;
    note: string | null;
}
//# sourceMappingURL=cheque.entity.d.ts.map