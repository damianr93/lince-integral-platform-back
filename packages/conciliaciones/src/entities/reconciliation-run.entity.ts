import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
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

@Entity('reconciliation_runs')
export class ReconciliationRunEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: true })
  title: string | null;

  @Column({ type: 'varchar', nullable: true })
  bankName: string | null;

  @Column({ type: 'varchar', nullable: true })
  accountRef: string | null;

  @Column({ default: 0 })
  windowDays: number;

  @Column({ nullable: true, type: 'timestamp' })
  cutDate: Date | null;

  @Column({ type: 'enum', enum: RunStatus, default: RunStatus.OPEN })
  status: RunStatus;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  excludeConcepts: string[];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  enabledCategoryIds: string[];

  @CreateDateColumn()
  createdAt: Date;

  @Column()
  createdById: string;

  @OneToMany(() => ExtractLineEntity, (l) => l.run)
  extractLines: ExtractLineEntity[];

  @OneToMany(() => SystemLineEntity, (l) => l.run)
  systemLines: SystemLineEntity[];

  @OneToMany(() => MatchEntity, (m) => m.run)
  matches: MatchEntity[];

  @OneToMany(() => UnmatchedExtractEntity, (u) => u.run)
  unmatchedExtract: UnmatchedExtractEntity[];

  @OneToMany(() => UnmatchedSystemEntity, (u) => u.run)
  unmatchedSystem: UnmatchedSystemEntity[];

  @OneToMany(() => PendingItemEntity, (p) => p.run)
  pendingItems: PendingItemEntity[];

  @OneToMany(() => ChequeEntity, (c) => c.run)
  cheques: ChequeEntity[];

  @OneToMany(() => RunMemberEntity, (m) => m.run)
  members: RunMemberEntity[];

  @OneToMany(() => MessageEntity, (m) => m.run)
  messages: MessageEntity[];

  @OneToMany(() => IssueEntity, (i) => i.run)
  issues: IssueEntity[];
}
