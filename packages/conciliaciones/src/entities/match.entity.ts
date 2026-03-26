import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ReconciliationRunEntity } from './reconciliation-run.entity';
import { ExtractLineEntity } from './extract-line.entity';
import { SystemLineEntity } from './system-line.entity';

@Entity('matches')
export class MatchEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  runId: string;

  @ManyToOne(() => ReconciliationRunEntity, (r) => r.matches, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'runId' })
  run: ReconciliationRunEntity;

  @Column()
  extractLineId: string;

  @ManyToOne(() => ExtractLineEntity, (l) => l.matchLines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'extractLineId' })
  extractLine: ExtractLineEntity;

  @Column()
  systemLineId: string;

  @ManyToOne(() => SystemLineEntity, (l) => l.matchLines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'systemLineId' })
  systemLine: SystemLineEntity;

  @Column()
  deltaDays: number;
}
