import { PendingStatus, RunStatus } from '../enums';
import { ReconciliationsService } from './reconciliations.service';
import { CreateRunDto } from './dto/create-run.dto';
import { UpdateSystemDto } from './dto/update-system.dto';
import { ShareRunDto } from './dto/share-run.dto';
import { CreateMessageDto } from './dto/message.dto';
import { CreatePendingDto, ResolvePendingDto } from './dto/create-pending.dto';
import { NotifyDto } from './dto/notify.dto';
import { SetMatchDto } from './dto/set-match.dto';
import { AddExcludedConceptDto } from './dto/add-excluded-concept.dto';
import { ExcludeManyDto } from './dto/exclude-many.dto';
import { ExcludeByCategoryDto } from './dto/exclude-by-category.dto';
import { RemoveExcludedConceptDto } from './dto/remove-excluded-concept.dto';
import { CreateIssueDto, UpdateIssueDto, CreateIssueCommentDto } from './dto/create-issue.dto';
import type { Response } from 'express';
import { ParseFileDto } from './dto/parse-file.dto';
export declare class ReconciliationsController {
    private service;
    constructor(service: ReconciliationsService);
    create(dto: CreateRunDto, req: {
        user: {
            id: string;
        };
    }): Promise<{
        runId: string;
        matched: number;
        onlyExtract: number;
        systemOverdue: number;
        systemDeferred: number;
    }>;
    list(): Promise<import("..").ReconciliationRunEntity[]>;
    createIssue(id: string, dto: CreateIssueDto, req: {
        user: {
            id: string;
        };
    }): Promise<{
        createdBy: import("@lince/database").UserEntity | null;
        comments: never[];
        id: string;
        runId: string;
        run: import("..").ReconciliationRunEntity;
        title: string;
        body: string | null;
        createdById: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateIssue(id: string, issueId: string, dto: UpdateIssueDto, req: {
        user: {
            id: string;
        };
    }): Promise<{
        createdBy: import("@lince/database").UserEntity | null;
        comments: {
            author: import("@lince/database").UserEntity | null;
            id: string;
            issueId: string;
            issue: import("..").IssueEntity;
            authorId: string;
            body: string;
            createdAt: Date;
        }[];
        id: string;
        runId: string;
        run: import("..").ReconciliationRunEntity;
        title: string;
        body: string | null;
        createdById: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    addIssueComment(id: string, issueId: string, dto: CreateIssueCommentDto, req: {
        user: {
            id: string;
        };
    }): Promise<{
        author: import("@lince/database").UserEntity | null;
        id: string;
        issueId: string;
        issue: import("..").IssueEntity;
        authorId: string;
        body: string;
        createdAt: Date;
    }>;
    removeMember(id: string, userId: string, req: {
        user: {
            id: string;
        };
    }): Promise<{
        removed: boolean;
    }>;
    get(id: string): Promise<{
        excludeConcepts: string[];
        extractLines: import("..").ExtractLineEntity[];
        systemLines: import("..").SystemLineEntity[];
        pendingItems: import("..").PendingItemEntity[];
        matches: import("..").MatchEntity[];
        unmatchedExtract: (import("..").UnmatchedExtractEntity | {
            id: `${string}-${string}-${string}-${string}-${string}`;
            runId: string;
            extractLineId: string;
        })[];
        unmatchedSystem: (import("..").UnmatchedSystemEntity | {
            id: `${string}-${string}-${string}-${string}-${string}`;
            runId: string;
            systemLineId: string;
            status: import("../enums").UnmatchedSystemStatus;
        })[];
        members: {
            user: import("@lince/database").UserEntity | null;
            id: string;
            runId: string;
            run: import("..").ReconciliationRunEntity;
            userId: string;
            role: import("../enums").RunMemberRole;
        }[];
        messages: {
            author: import("@lince/database").UserEntity | null;
            id: string;
            runId: string;
            run: import("..").ReconciliationRunEntity;
            authorId: string;
            body: string;
            createdAt: Date;
        }[];
        issues: {
            createdBy: import("@lince/database").UserEntity | null;
            comments: {
                author: import("@lince/database").UserEntity | null;
                id: string;
                issueId: string;
                issue: import("..").IssueEntity;
                authorId: string;
                body: string;
                createdAt: Date;
            }[];
            id: string;
            runId: string;
            run: import("..").ReconciliationRunEntity;
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
    }>;
    updateSystem(id: string, dto: UpdateSystemDto, req: {
        user: {
            id: string;
        };
    }): Promise<{
        excludeConcepts: string[];
        extractLines: import("..").ExtractLineEntity[];
        systemLines: import("..").SystemLineEntity[];
        pendingItems: import("..").PendingItemEntity[];
        matches: import("..").MatchEntity[];
        unmatchedExtract: (import("..").UnmatchedExtractEntity | {
            id: `${string}-${string}-${string}-${string}-${string}`;
            runId: string;
            extractLineId: string;
        })[];
        unmatchedSystem: (import("..").UnmatchedSystemEntity | {
            id: `${string}-${string}-${string}-${string}-${string}`;
            runId: string;
            systemLineId: string;
            status: import("../enums").UnmatchedSystemStatus;
        })[];
        members: {
            user: import("@lince/database").UserEntity | null;
            id: string;
            runId: string;
            run: import("..").ReconciliationRunEntity;
            userId: string;
            role: import("../enums").RunMemberRole;
        }[];
        messages: {
            author: import("@lince/database").UserEntity | null;
            id: string;
            runId: string;
            run: import("..").ReconciliationRunEntity;
            authorId: string;
            body: string;
            createdAt: Date;
        }[];
        issues: {
            createdBy: import("@lince/database").UserEntity | null;
            comments: {
                author: import("@lince/database").UserEntity | null;
                id: string;
                issueId: string;
                issue: import("..").IssueEntity;
                authorId: string;
                body: string;
                createdAt: Date;
            }[];
            id: string;
            runId: string;
            run: import("..").ReconciliationRunEntity;
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
    addExcludedConcept(id: string, dto: AddExcludedConceptDto, req: {
        user: {
            id: string;
        };
    }): Promise<{
        excludeConcepts: string[];
        extractLines: import("..").ExtractLineEntity[];
        systemLines: import("..").SystemLineEntity[];
        pendingItems: import("..").PendingItemEntity[];
        matches: import("..").MatchEntity[];
        unmatchedExtract: (import("..").UnmatchedExtractEntity | {
            id: `${string}-${string}-${string}-${string}-${string}`;
            runId: string;
            extractLineId: string;
        })[];
        unmatchedSystem: (import("..").UnmatchedSystemEntity | {
            id: `${string}-${string}-${string}-${string}-${string}`;
            runId: string;
            systemLineId: string;
            status: import("../enums").UnmatchedSystemStatus;
        })[];
        members: {
            user: import("@lince/database").UserEntity | null;
            id: string;
            runId: string;
            run: import("..").ReconciliationRunEntity;
            userId: string;
            role: import("../enums").RunMemberRole;
        }[];
        messages: {
            author: import("@lince/database").UserEntity | null;
            id: string;
            runId: string;
            run: import("..").ReconciliationRunEntity;
            authorId: string;
            body: string;
            createdAt: Date;
        }[];
        issues: {
            createdBy: import("@lince/database").UserEntity | null;
            comments: {
                author: import("@lince/database").UserEntity | null;
                id: string;
                issueId: string;
                issue: import("..").IssueEntity;
                authorId: string;
                body: string;
                createdAt: Date;
            }[];
            id: string;
            runId: string;
            run: import("..").ReconciliationRunEntity;
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
    addExcludedConcepts(id: string, dto: ExcludeManyDto, req: {
        user: {
            id: string;
        };
    }): Promise<{
        excludeConcepts: string[];
        extractLines: import("..").ExtractLineEntity[];
        systemLines: import("..").SystemLineEntity[];
        pendingItems: import("..").PendingItemEntity[];
        matches: import("..").MatchEntity[];
        unmatchedExtract: (import("..").UnmatchedExtractEntity | {
            id: `${string}-${string}-${string}-${string}-${string}`;
            runId: string;
            extractLineId: string;
        })[];
        unmatchedSystem: (import("..").UnmatchedSystemEntity | {
            id: `${string}-${string}-${string}-${string}-${string}`;
            runId: string;
            systemLineId: string;
            status: import("../enums").UnmatchedSystemStatus;
        })[];
        members: {
            user: import("@lince/database").UserEntity | null;
            id: string;
            runId: string;
            run: import("..").ReconciliationRunEntity;
            userId: string;
            role: import("../enums").RunMemberRole;
        }[];
        messages: {
            author: import("@lince/database").UserEntity | null;
            id: string;
            runId: string;
            run: import("..").ReconciliationRunEntity;
            authorId: string;
            body: string;
            createdAt: Date;
        }[];
        issues: {
            createdBy: import("@lince/database").UserEntity | null;
            comments: {
                author: import("@lince/database").UserEntity | null;
                id: string;
                issueId: string;
                issue: import("..").IssueEntity;
                authorId: string;
                body: string;
                createdAt: Date;
            }[];
            id: string;
            runId: string;
            run: import("..").ReconciliationRunEntity;
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
    addExcludedByCategory(id: string, dto: ExcludeByCategoryDto, req: {
        user: {
            id: string;
        };
    }): Promise<{
        excludeConcepts: string[];
        extractLines: import("..").ExtractLineEntity[];
        systemLines: import("..").SystemLineEntity[];
        pendingItems: import("..").PendingItemEntity[];
        matches: import("..").MatchEntity[];
        unmatchedExtract: (import("..").UnmatchedExtractEntity | {
            id: `${string}-${string}-${string}-${string}-${string}`;
            runId: string;
            extractLineId: string;
        })[];
        unmatchedSystem: (import("..").UnmatchedSystemEntity | {
            id: `${string}-${string}-${string}-${string}-${string}`;
            runId: string;
            systemLineId: string;
            status: import("../enums").UnmatchedSystemStatus;
        })[];
        members: {
            user: import("@lince/database").UserEntity | null;
            id: string;
            runId: string;
            run: import("..").ReconciliationRunEntity;
            userId: string;
            role: import("../enums").RunMemberRole;
        }[];
        messages: {
            author: import("@lince/database").UserEntity | null;
            id: string;
            runId: string;
            run: import("..").ReconciliationRunEntity;
            authorId: string;
            body: string;
            createdAt: Date;
        }[];
        issues: {
            createdBy: import("@lince/database").UserEntity | null;
            comments: {
                author: import("@lince/database").UserEntity | null;
                id: string;
                issueId: string;
                issue: import("..").IssueEntity;
                authorId: string;
                body: string;
                createdAt: Date;
            }[];
            id: string;
            runId: string;
            run: import("..").ReconciliationRunEntity;
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
    removeExcludedConcept(id: string, dto: RemoveExcludedConceptDto, req: {
        user: {
            id: string;
        };
    }): Promise<{
        excludeConcepts: string[];
        extractLines: import("..").ExtractLineEntity[];
        systemLines: import("..").SystemLineEntity[];
        pendingItems: import("..").PendingItemEntity[];
        matches: import("..").MatchEntity[];
        unmatchedExtract: (import("..").UnmatchedExtractEntity | {
            id: `${string}-${string}-${string}-${string}-${string}`;
            runId: string;
            extractLineId: string;
        })[];
        unmatchedSystem: (import("..").UnmatchedSystemEntity | {
            id: `${string}-${string}-${string}-${string}-${string}`;
            runId: string;
            systemLineId: string;
            status: import("../enums").UnmatchedSystemStatus;
        })[];
        members: {
            user: import("@lince/database").UserEntity | null;
            id: string;
            runId: string;
            run: import("..").ReconciliationRunEntity;
            userId: string;
            role: import("../enums").RunMemberRole;
        }[];
        messages: {
            author: import("@lince/database").UserEntity | null;
            id: string;
            runId: string;
            run: import("..").ReconciliationRunEntity;
            authorId: string;
            body: string;
            createdAt: Date;
        }[];
        issues: {
            createdBy: import("@lince/database").UserEntity | null;
            comments: {
                author: import("@lince/database").UserEntity | null;
                id: string;
                issueId: string;
                issue: import("..").IssueEntity;
                authorId: string;
                body: string;
                createdAt: Date;
            }[];
            id: string;
            runId: string;
            run: import("..").ReconciliationRunEntity;
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
    updateRun(id: string, body: {
        status?: RunStatus;
        bankName?: string;
        enabledCategoryIds?: string[];
    }, req: {
        user: {
            id: string;
        };
    }): Promise<import("..").ReconciliationRunEntity | null>;
    deleteRun(id: string, req: {
        user: {
            id: string;
            globalRole: string;
        };
    }): Promise<{
        deleted: boolean;
    }>;
    share(id: string, dto: ShareRunDto, req: {
        user: {
            id: string;
        };
    }): Promise<import("..").RunMemberEntity | null>;
    addMessage(id: string, dto: CreateMessageDto, req: {
        user: {
            id: string;
        };
    }): Promise<{
        author: import("@lince/database").UserEntity | null;
        id: string;
        runId: string;
        run: import("..").ReconciliationRunEntity;
        authorId: string;
        body: string;
        createdAt: Date;
    }>;
    parseFile(file: Express.Multer.File, dto: ParseFileDto): Promise<{
        sheets: string[];
        rows: Record<string, unknown>[];
    }>;
    export(id: string, req: {
        user: {
            id: string;
        };
    }, res: Response): Promise<void>;
    createPending(id: string, dto: CreatePendingDto, req: {
        user: {
            id: string;
        };
    }): Promise<import("..").PendingItemEntity>;
    resolvePending(id: string, pendingId: string, dto: ResolvePendingDto, req: {
        user: {
            id: string;
        };
    }): Promise<import("..").PendingItemEntity | null>;
    updatePendingStatus(id: string, pendingId: string, body: {
        status: PendingStatus;
    }, req: {
        user: {
            id: string;
        };
    }): Promise<import("..").PendingItemEntity | null>;
    setMatch(id: string, dto: SetMatchDto, req: {
        user: {
            id: string;
        };
    }): Promise<{
        excludeConcepts: string[];
        extractLines: import("..").ExtractLineEntity[];
        systemLines: import("..").SystemLineEntity[];
        pendingItems: import("..").PendingItemEntity[];
        matches: import("..").MatchEntity[];
        unmatchedExtract: (import("..").UnmatchedExtractEntity | {
            id: `${string}-${string}-${string}-${string}-${string}`;
            runId: string;
            extractLineId: string;
        })[];
        unmatchedSystem: (import("..").UnmatchedSystemEntity | {
            id: `${string}-${string}-${string}-${string}-${string}`;
            runId: string;
            systemLineId: string;
            status: import("../enums").UnmatchedSystemStatus;
        })[];
        members: {
            user: import("@lince/database").UserEntity | null;
            id: string;
            runId: string;
            run: import("..").ReconciliationRunEntity;
            userId: string;
            role: import("../enums").RunMemberRole;
        }[];
        messages: {
            author: import("@lince/database").UserEntity | null;
            id: string;
            runId: string;
            run: import("..").ReconciliationRunEntity;
            authorId: string;
            body: string;
            createdAt: Date;
        }[];
        issues: {
            createdBy: import("@lince/database").UserEntity | null;
            comments: {
                author: import("@lince/database").UserEntity | null;
                id: string;
                issueId: string;
                issue: import("..").IssueEntity;
                authorId: string;
                body: string;
                createdAt: Date;
            }[];
            id: string;
            runId: string;
            run: import("..").ReconciliationRunEntity;
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
    notifyPending(id: string, dto: NotifyDto, req: {
        user: {
            id: string;
        };
    }): Promise<({
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
}
//# sourceMappingURL=reconciliations.controller.d.ts.map