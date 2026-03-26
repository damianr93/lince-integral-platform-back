import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { bigintTransformer } from './bigint.transformer';
import { ReconciliationRunEntity } from './reconciliation-run.entity';
import { MatchEntity } from './match.entity';
import { UnmatchedSystemEntity } from './unmatched-system.entity';
import { PendingItemEntity } from './pending-item.entity';

@Entity('system_lines')
export class SystemLineEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  runId: string;

  @ManyToOne(() => ReconciliationRunEntity, (r) => r.systemLines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'runId' })
  run: ReconciliationRunEntity;

  @Column({ type: 'int', nullable: true })
  rowIndex: number | null;

  @Column({ nullable: true, type: 'timestamp' })
  issueDate: Date | null;

  @Column({ nullable: true, type: 'timestamp' })
  dueDate: Date | null;

  @Column({ type: 'float' })
  amount: number;

  @Column({ type: 'bigint', transformer: bigintTransformer })
  amountKey: bigint;

  @Column({ type: 'varchar', nullable: true })
  description: string | null;

  @Column({ type: 'jsonb' })
  raw: Record<string, unknown>;

  @OneToMany(() => MatchEntity, (m) => m.systemLine)
  matchLines: MatchEntity[];

  @OneToOne(() => UnmatchedSystemEntity, (u) => u.systemLine)
  unmatched: UnmatchedSystemEntity | null;

  @OneToMany(() => PendingItemEntity, (p) => p.systemLine)
  pendingItems: PendingItemEntity[];
}
