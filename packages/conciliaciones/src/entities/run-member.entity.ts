import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { RunMemberRole } from '../enums';
import { ReconciliationRunEntity } from './reconciliation-run.entity';

@Entity('run_members')
@Unique(['runId', 'userId'])
export class RunMemberEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  runId: string;

  @ManyToOne(() => ReconciliationRunEntity, (r) => r.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'runId' })
  run: ReconciliationRunEntity;

  @Column()
  userId: string;

  @Column({ type: 'enum', enum: RunMemberRole, default: RunMemberRole.EDITOR })
  role: RunMemberRole;
}
