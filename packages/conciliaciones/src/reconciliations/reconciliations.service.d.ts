import { DataSource, Repository } from 'typeorm';
import { UserEntity } from '@lince/database';
import { RunMemberRole, UnmatchedSystemStatus, PendingStatus, RunStatus } from '../enums';
import { ReconciliationRunEntity } from '../entities/reconciliation-run.entity';
import { ExtractLineEntity } from '../entities/extract-line.entity';
import { SystemLineEntity } from '../entities/system-line.entity';
import { MatchEntity } from '../entities/match.entity';
import { UnmatchedExtractEntity } from '../entities/unmatched-extract.entity';
import { UnmatchedSystemEntity } from '../entities/unmatched-system.entity';
import { RunMemberEntity } from '../entities/run-member.entity';
import { MessageEntity } from '../entities/message.entity';
import { IssueEntity } from '../entities/issue.entity';
import { IssueCommentEntity } from '../entities/issue-comment.entity';
import { PendingItemEntity } from '../entities/pending-item.entity';
import { ExpenseCategoryEntity } from '../entities/expense-category.entity';
import { CreateRunDto } from './dto/create-run.dto';
import { UpdateSystemDto } from './dto/update-system.dto';
import { CreatePendingDto, ResolvePendingDto } from './dto/create-pending.dto';
import { NotifyDto } from './dto/notify.dto';
export declare class ReconciliationsService {
    private runRepo;
    private extractLineRepo;
    private systemLineRepo;
    private matchRepo;
    private unmatchedExtractRepo;
    private unmatchedSystemRepo;
    private runMemberRepo;
    private messageRepo;
    private issueRepo;
    private issueCommentRepo;
    private pendingItemRepo;
    private categoryRepo;
    private userRepo;
    private dataSource;
    constructor(runRepo: Repository<ReconciliationRunEntity>, extractLineRepo: Repository<ExtractLineEntity>, systemLineRepo: Repository<SystemLineEntity>, matchRepo: Repository<MatchEntity>, unmatchedExtractRepo: Repository<UnmatchedExtractEntity>, unmatchedSystemRepo: Repository<UnmatchedSystemEntity>, runMemberRepo: Repository<RunMemberEntity>, messageRepo: Repository<MessageEntity>, issueRepo: Repository<IssueEntity>, issueCommentRepo: Repository<IssueCommentEntity>, pendingItemRepo: Repository<PendingItemEntity>, categoryRepo: Repository<ExpenseCategoryEntity>, userRepo: Repository<UserEntity>, dataSource: DataSource);
    createRun(dto: CreateRunDto, userId: string): Promise<{
        runId: string;
        matched: number;
        onlyExtract: number;
        systemOverdue: number;
        systemDeferred: number;
    }>;
    getRun(runId: string): Promise<{
        excludeConcepts: string[];
        extractLines: ExtractLineEntity[];
        systemLines: SystemLineEntity[];
        pendingItems: PendingItemEntity[];
        matches: MatchEntity[];
        unmatchedExtract: (UnmatchedExtractEntity | {
            id: `${string}-${string}-${string}-${string}-${string}`;
            runId: string;
            extractLineId: string;
        })[];
        unmatchedSystem: (UnmatchedSystemEntity | {
            id: `${string}-${string}-${string}-${string}-${string}`;
            runId: string;
            systemLineId: string;
            status: UnmatchedSystemStatus;
        })[];
        members: {
            user: UserEntity | null;
            id: string;
            runId: string;
            run: ReconciliationRunEntity;
            userId: string;
            role: RunMemberRole;
        }[];
        messages: {
            author: UserEntity | null;
            id: string;
            runId: string;
            run: ReconciliationRunEntity;
            authorId: string;
            body: string;
            createdAt: Date;
        }[];
        issues: {
            createdBy: UserEntity | null;
            comments: {
                author: UserEntity | null;
                id: string;
                issueId: string;
                issue: IssueEntity;
                authorId: string;
                body: string;
                createdAt: Date;
            }[];
            id: string;
            runId: string;
            run: ReconciliationRunEntity;
            title: string;
            body: string | null;
            createdById: string;
            createdAt: Date;
            updatedAt: Date;
        }[];
        id: string;
        title: string | null;
        bankName: string | null;
        accountRef: string | null;
        windowDays: number;
        cutDate: Date | null;
        status: RunStatus;
        enabledCategoryIds: string[];
        createdAt: Date;
        createdById: string;
        cheques: import("..").ChequeEntity[];
    } | null>;
    updateRun(runId: string, userId: string, data: {
        status?: RunStatus;
        bankName?: string | null;
        enabledCategoryIds?: string[];
    }): Promise<ReconciliationRunEntity | null>;
    deleteRun(runId: string, userId: string, isSuperAdmin?: boolean): Promise<{
        deleted: boolean;
    }>;
    addExcludedConcept(runId: string, userId: string, concept: string): Promise<{
        excludeConcepts: string[];
        extractLines: ExtractLineEntity[];
        systemLines: SystemLineEntity[];
        pendingItems: PendingItemEntity[];
        matches: MatchEntity[];
        unmatchedExtract: (UnmatchedExtractEntity | {
            id: `${string}-${string}-${string}-${string}-${string}`;
            runId: string;
            extractLineId: string;
        })[];
        unmatchedSystem: (UnmatchedSystemEntity | {
            id: `${string}-${string}-${string}-${string}-${string}`;
            runId: string;
            systemLineId: string;
            status: UnmatchedSystemStatus;
        })[];
        members: {
            user: UserEntity | null;
            id: string;
            runId: string;
            run: ReconciliationRunEntity;
            userId: string;
            role: RunMemberRole;
        }[];
        messages: {
            author: UserEntity | null;
            id: string;
            runId: string;
            run: ReconciliationRunEntity;
            authorId: string;
            body: string;
            createdAt: Date;
        }[];
        issues: {
            createdBy: UserEntity | null;
            comments: {
                author: UserEntity | null;
                id: string;
                issueId: string;
                issue: IssueEntity;
                authorId: string;
                body: string;
                createdAt: Date;
            }[];
            id: string;
            runId: string;
            run: ReconciliationRunEntity;
            title: string;
            body: string | null;
            createdById: string;
            createdAt: Date;
            updatedAt: Date;
        }[];
        id: string;
        title: string | null;
        bankName: string | null;
        accountRef: string | null;
        windowDays: number;
        cutDate: Date | null;
        status: RunStatus;
        enabledCategoryIds: string[];
        createdAt: Date;
        createdById: string;
        cheques: import("..").ChequeEntity[];
    } | null>;
    addExcludedConcepts(runId: string, userId: string, concepts: string[]): Promise<{
        excludeConcepts: string[];
        extractLines: ExtractLineEntity[];
        systemLines: SystemLineEntity[];
        pendingItems: PendingItemEntity[];
        matches: MatchEntity[];
        unmatchedExtract: (UnmatchedExtractEntity | {
            id: `${string}-${string}-${string}-${string}-${string}`;
            runId: string;
            extractLineId: string;
        })[];
        unmatchedSystem: (UnmatchedSystemEntity | {
            id: `${string}-${string}-${string}-${string}-${string}`;
            runId: string;
            systemLineId: string;
            status: UnmatchedSystemStatus;
        })[];
        members: {
            user: UserEntity | null;
            id: string;
            runId: string;
            run: ReconciliationRunEntity;
            userId: string;
            role: RunMemberRole;
        }[];
        messages: {
            author: UserEntity | null;
            id: string;
            runId: string;
            run: ReconciliationRunEntity;
            authorId: string;
            body: string;
            createdAt: Date;
        }[];
        issues: {
            createdBy: UserEntity | null;
            comments: {
                author: UserEntity | null;
                id: string;
                issueId: string;
                issue: IssueEntity;
                authorId: string;
                body: string;
                createdAt: Date;
            }[];
            id: string;
            runId: string;
            run: ReconciliationRunEntity;
            title: string;
            body: string | null;
            createdById: string;
            createdAt: Date;
            updatedAt: Date;
        }[];
        id: string;
        title: string | null;
        bankName: string | null;
        accountRef: string | null;
        windowDays: number;
        cutDate: Date | null;
        status: RunStatus;
        enabledCategoryIds: string[];
        createdAt: Date;
        createdById: string;
        cheques: import("..").ChequeEntity[];
    } | null>;
    addExcludedByCategory(runId: string, userId: string, categoryId: string): Promise<{
        excludeConcepts: string[];
        extractLines: ExtractLineEntity[];
        systemLines: SystemLineEntity[];
        pendingItems: PendingItemEntity[];
        matches: MatchEntity[];
        unmatchedExtract: (UnmatchedExtractEntity | {
            id: `${string}-${string}-${string}-${string}-${string}`;
            runId: string;
            extractLineId: string;
        })[];
        unmatchedSystem: (UnmatchedSystemEntity | {
            id: `${string}-${string}-${string}-${string}-${string}`;
            runId: string;
            systemLineId: string;
            status: UnmatchedSystemStatus;
        })[];
        members: {
            user: UserEntity | null;
            id: string;
            runId: string;
            run: ReconciliationRunEntity;
            userId: string;
            role: RunMemberRole;
        }[];
        messages: {
            author: UserEntity | null;
            id: string;
            runId: string;
            run: ReconciliationRunEntity;
            authorId: string;
            body: string;
            createdAt: Date;
        }[];
        issues: {
            createdBy: UserEntity | null;
            comments: {
                author: UserEntity | null;
                id: string;
                issueId: string;
                issue: IssueEntity;
                authorId: string;
                body: string;
                createdAt: Date;
            }[];
            id: string;
            runId: string;
            run: ReconciliationRunEntity;
            title: string;
            body: string | null;
            createdById: string;
            createdAt: Date;
            updatedAt: Date;
        }[];
        id: string;
        title: string | null;
        bankName: string | null;
        accountRef: string | null;
        windowDays: number;
        cutDate: Date | null;
        status: RunStatus;
        enabledCategoryIds: string[];
        createdAt: Date;
        createdById: string;
        cheques: import("..").ChequeEntity[];
    } | null>;
    removeExcludedConcept(runId: string, userId: string, concept: string): Promise<{
        excludeConcepts: string[];
        extractLines: ExtractLineEntity[];
        systemLines: SystemLineEntity[];
        pendingItems: PendingItemEntity[];
        matches: MatchEntity[];
        unmatchedExtract: (UnmatchedExtractEntity | {
            id: `${string}-${string}-${string}-${string}-${string}`;
            runId: string;
            extractLineId: string;
        })[];
        unmatchedSystem: (UnmatchedSystemEntity | {
            id: `${string}-${string}-${string}-${string}-${string}`;
            runId: string;
            systemLineId: string;
            status: UnmatchedSystemStatus;
        })[];
        members: {
            user: UserEntity | null;
            id: string;
            runId: string;
            run: ReconciliationRunEntity;
            userId: string;
            role: RunMemberRole;
        }[];
        messages: {
            author: UserEntity | null;
            id: string;
            runId: string;
            run: ReconciliationRunEntity;
            authorId: string;
            body: string;
            createdAt: Date;
        }[];
        issues: {
            createdBy: UserEntity | null;
            comments: {
                author: UserEntity | null;
                id: string;
                issueId: string;
                issue: IssueEntity;
                authorId: string;
                body: string;
                createdAt: Date;
            }[];
            id: string;
            runId: string;
            run: ReconciliationRunEntity;
            title: string;
            body: string | null;
            createdById: string;
            createdAt: Date;
            updatedAt: Date;
        }[];
        id: string;
        title: string | null;
        bankName: string | null;
        accountRef: string | null;
        windowDays: number;
        cutDate: Date | null;
        status: RunStatus;
        enabledCategoryIds: string[];
        createdAt: Date;
        createdById: string;
        cheques: import("..").ChequeEntity[];
    } | null>;
    private conceptMatchesCategory;
    private applyExcludedLines;
    updateSystemData(runId: string, userId: string, dto: UpdateSystemDto): Promise<{
        excludeConcepts: string[];
        extractLines: ExtractLineEntity[];
        systemLines: SystemLineEntity[];
        pendingItems: PendingItemEntity[];
        matches: MatchEntity[];
        unmatchedExtract: (UnmatchedExtractEntity | {
            id: `${string}-${string}-${string}-${string}-${string}`;
            runId: string;
            extractLineId: string;
        })[];
        unmatchedSystem: (UnmatchedSystemEntity | {
            id: `${string}-${string}-${string}-${string}-${string}`;
            runId: string;
            systemLineId: string;
            status: UnmatchedSystemStatus;
        })[];
        members: {
            user: UserEntity | null;
            id: string;
            runId: string;
            run: ReconciliationRunEntity;
            userId: string;
            role: RunMemberRole;
        }[];
        messages: {
            author: UserEntity | null;
            id: string;
            runId: string;
            run: ReconciliationRunEntity;
            authorId: string;
            body: string;
            createdAt: Date;
        }[];
        issues: {
            createdBy: UserEntity | null;
            comments: {
                author: UserEntity | null;
                id: string;
                issueId: string;
                issue: IssueEntity;
                authorId: string;
                body: string;
                createdAt: Date;
            }[];
            id: string;
            runId: string;
            run: ReconciliationRunEntity;
            title: string;
            body: string | null;
            createdById: string;
            createdAt: Date;
            updatedAt: Date;
        }[];
        id: string;
        title: string | null;
        bankName: string | null;
        accountRef: string | null;
        windowDays: number;
        cutDate: Date | null;
        status: RunStatus;
        enabledCategoryIds: string[];
        createdAt: Date;
        createdById: string;
        cheques: import("..").ChequeEntity[];
    } | null>;
    private recomputeMatches;
    listRuns(): Promise<ReconciliationRunEntity[]>;
    private assertRunExists;
    assertCanEdit(runId: string, userId: string): Promise<void>;
    private assertOwner;
    private assertRunOpen;
    shareRun(runId: string, userId: string, email: string, role: RunMemberRole): Promise<RunMemberEntity | null>;
    removeMember(runId: string, ownerUserId: string, targetUserId: string): Promise<{
        removed: boolean;
    }>;
    addMessage(runId: string, userId: string, body: string): Promise<{
        author: UserEntity | null;
        id: string;
        runId: string;
        run: ReconciliationRunEntity;
        authorId: string;
        body: string;
        createdAt: Date;
    }>;
    exportRun(runId: string, userId: string): Promise<Buffer<ArrayBuffer>>;
    parseFile(file: Express.Multer.File, sheetName?: string, headerRow?: number): Promise<{
        sheets: string[];
        rows: Record<string, unknown>[];
    }>;
    private resolveCategory;
    createPending(runId: string, userId: string, dto: CreatePendingDto): Promise<PendingItemEntity>;
    resolvePending(runId: string, userId: string, pendingId: string, dto: ResolvePendingDto): Promise<PendingItemEntity | null>;
    updatePendingStatus(runId: string, userId: string, pendingId: string, status: PendingStatus): Promise<PendingItemEntity | null>;
    setMatch(runId: string, userId: string, systemLineId: string, extractLineIds: string[]): Promise<{
        excludeConcepts: string[];
        extractLines: ExtractLineEntity[];
        systemLines: SystemLineEntity[];
        pendingItems: PendingItemEntity[];
        matches: MatchEntity[];
        unmatchedExtract: (UnmatchedExtractEntity | {
            id: `${string}-${string}-${string}-${string}-${string}`;
            runId: string;
            extractLineId: string;
        })[];
        unmatchedSystem: (UnmatchedSystemEntity | {
            id: `${string}-${string}-${string}-${string}-${string}`;
            runId: string;
            systemLineId: string;
            status: UnmatchedSystemStatus;
        })[];
        members: {
            user: UserEntity | null;
            id: string;
            runId: string;
            run: ReconciliationRunEntity;
            userId: string;
            role: RunMemberRole;
        }[];
        messages: {
            author: UserEntity | null;
            id: string;
            runId: string;
            run: ReconciliationRunEntity;
            authorId: string;
            body: string;
            createdAt: Date;
        }[];
        issues: {
            createdBy: UserEntity | null;
            comments: {
                author: UserEntity | null;
                id: string;
                issueId: string;
                issue: IssueEntity;
                authorId: string;
                body: string;
                createdAt: Date;
            }[];
            id: string;
            runId: string;
            run: ReconciliationRunEntity;
            title: string;
            body: string | null;
            createdById: string;
            createdAt: Date;
            updatedAt: Date;
        }[];
        id: string;
        title: string | null;
        bankName: string | null;
        accountRef: string | null;
        windowDays: number;
        cutDate: Date | null;
        status: RunStatus;
        enabledCategoryIds: string[];
        createdAt: Date;
        createdById: string;
        cheques: import("..").ChequeEntity[];
    } | null>;
    notifyPending(runId: string, userId: string, dto: NotifyDto): Promise<({
        area: string;
        email: string;
        sent: boolean;
        error?: undefined;
    } | {
        area: string;
        email: string;
        sent: boolean;
        error: string;
    })[]>;
    private cellValue;
    createIssue(runId: string, userId: string, data: {
        title: string;
        body?: string;
    }): Promise<{
        createdBy: UserEntity | null;
        comments: never[];
        id: string;
        runId: string;
        run: ReconciliationRunEntity;
        title: string;
        body: string | null;
        createdById: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateIssue(runId: string, issueId: string, userId: string, data: {
        title?: string;
        body?: string;
    }): Promise<{
        createdBy: UserEntity | null;
        comments: {
            author: UserEntity | null;
            id: string;
            issueId: string;
            issue: IssueEntity;
            authorId: string;
            body: string;
            createdAt: Date;
        }[];
        id: string;
        runId: string;
        run: ReconciliationRunEntity;
        title: string;
        body: string | null;
        createdById: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    addIssueComment(issueId: string, userId: string, body: string): Promise<{
        author: UserEntity | null;
        id: string;
        issueId: string;
        issue: IssueEntity;
        authorId: string;
        body: string;
        createdAt: Date;
    }>;
}
//# sourceMappingURL=reconciliations.service.d.ts.map