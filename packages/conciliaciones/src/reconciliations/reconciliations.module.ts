import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { ReconciliationsService } from './reconciliations.service';
import { ReconciliationsController } from './reconciliations.controller';
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
import { UserEntity } from '@lince/database';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReconciliationRunEntity,
      ExtractLineEntity,
      SystemLineEntity,
      MatchEntity,
      UnmatchedExtractEntity,
      UnmatchedSystemEntity,
      RunMemberEntity,
      MessageEntity,
      IssueEntity,
      IssueCommentEntity,
      PendingItemEntity,
      ExpenseCategoryEntity,
      UserEntity,
    ]),
    MulterModule.register({ storage: undefined }),
  ],
  controllers: [ReconciliationsController],
  providers: [ReconciliationsService],
})
export class ReconciliationsModule {}
