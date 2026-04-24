import { IssueEntity } from './issue.entity';
export declare class IssueCommentEntity {
    id: string;
    issueId: string;
    issue: IssueEntity;
    authorId: string;
    body: string;
    createdAt: Date;
}
//# sourceMappingURL=issue-comment.entity.d.ts.map