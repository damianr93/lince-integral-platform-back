import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PendingStatus } from '../enums';
import { ReconciliationRunEntity } from './reconciliation-run.entity';
import { SystemLineEntity } from './system-line.entity';

@Entity('pending_items')
export class PendingItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  runId: string;

  @ManyToOne(() => ReconciliationRunEntity, (r) => r.pendingItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'runId' })
  run: ReconciliationRunEntity;

  @Column()
  area: string;

  @Column({ type: 'enum', enum: PendingStatus, default: PendingStatus.OPEN })
  status: PendingStatus;

  @Column({ nullable: true, type: 'timestamp' })
  resolvedAt: Date | null;

  @Column({ nullable: true, type: 'text' })
  note: string | null;

  @Column({ type: 'varchar', nullable: true })
  systemLineId: string | null;

  @ManyToOne(() => SystemLineEntity, (l) => l.pendingItems, { nullable: true })
  @JoinColumn({ name: 'systemLineId' })
  systemLine: SystemLineEntity | null;
}
