import { RunStatus } from '../enums';
import { ExtractLineEntity } from './extract-line.entity';
import { SystemLineEntity } from './system-line.entity';
import { MatchEntity } from './match.entity';
import { UnmatchedExtractEntity } from './unmatched-extract.entity';
import { UnmatchedSystemEntity } from './unmatched-system.entity';
import { PendingItemEntity } from './pending-item.entity';
import { ChequeEntity } from './cheque.entity';
import { RunMemberEntity } from './run-member.entity';
import { MessageEntity } from './message.entity';
import { IssueEntity } from './issue.entity';
export declare class ReconciliationRunEntity {
    id: string;
    title: string | null;
    bankName: string | null;
    accountRef: string | null;
    windowDays: number;
    cutDate: Date | null;
    status: RunStatus;
    excludeConcepts: string[];
    enabledCategoryIds: string[];
    createdAt: Date;
    createdById: string;
    extractLines: ExtractLineEntity[];
    systemLines: SystemLineEntity[];
    matches: MatchEntity[];
    unmatchedExtract: UnmatchedExtractEntity[];
    unmatchedSystem: UnmatchedSystemEntity[];
    pendingItems: PendingItemEntity[];
    cheques: ChequeEntity[];
    members: RunMemberEntity[];
    messages: MessageEntity[];
    issues: IssueEntity[];
}
//# sourceMappingURL=reconciliation-run.entity.d.ts.map