import { ReconciliationRunEntity } from './reconciliation-run.entity';
import { IssueCommentEntity } from './issue-comment.entity';
export declare class IssueEntity {
    id: string;
    runId: string;
    run: ReconciliationRunEntity;
    title: string;
    body: string | null;
    createdById: string;
    createdAt: Date;
    updatedAt: Date;
    comments: IssueCommentEntity[];
}
//# sourceMappingURL=issue.entity.d.ts.map