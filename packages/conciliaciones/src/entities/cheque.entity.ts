import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ChequeStatus } from '../enums';
import { ReconciliationRunEntity } from './reconciliation-run.entity';

@Entity('cheques')
export class ChequeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  runId: string;

  @ManyToOne(() => ReconciliationRunEntity, (r) => r.cheques, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'runId' })
  run: ReconciliationRunEntity;

  @Column({ type: 'varchar', nullable: true })
  number: string | null;

  @Column({ nullable: true, type: 'timestamp' })
  issueDate: Date | null;

  @Column({ nullable: true, type: 'timestamp' })
  dueDate: Date | null;

  @Column({ type: 'float' })
  amount: number;

  @Column({ type: 'enum', enum: ChequeStatus, default: ChequeStatus.ISSUED })
  status: ChequeStatus;

  @Column({ nullable: true, type: 'text' })
  note: string | null;
}
