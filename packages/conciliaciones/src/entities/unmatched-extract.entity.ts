import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ReconciliationRunEntity } from './reconciliation-run.entity';
import { ExtractLineEntity } from './extract-line.entity';

@Entity('unmatched_extracts')
export class UnmatchedExtractEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  runId: string;

  @ManyToOne(() => ReconciliationRunEntity, (r) => r.unmatchedExtract, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'runId' })
  run: ReconciliationRunEntity;

  @Column({ unique: true })
  extractLineId: string;

  @OneToOne(() => ExtractLineEntity, (l) => l.unmatched, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'extractLineId' })
  extractLine: ExtractLineEntity;
}
