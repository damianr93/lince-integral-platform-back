import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UnmatchedSystemStatus } from '../enums';
import { ReconciliationRunEntity } from './reconciliation-run.entity';
import { SystemLineEntity } from './system-line.entity';

@Entity('unmatched_systems')
export class UnmatchedSystemEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  runId: string;

  @ManyToOne(() => ReconciliationRunEntity, (r) => r.unmatchedSystem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'runId' })
  run: ReconciliationRunEntity;

  @Column({ unique: true })
  systemLineId: string;

  @OneToOne(() => SystemLineEntity, (l) => l.unmatched, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'systemLineId' })
  systemLine: SystemLineEntity;

  @Column({ type: 'enum', enum: UnmatchedSystemStatus })
  status: UnmatchedSystemStatus;
}
