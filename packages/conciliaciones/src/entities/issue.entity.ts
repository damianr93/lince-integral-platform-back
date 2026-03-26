import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { ReconciliationRunEntity } from './reconciliation-run.entity';
import { IssueCommentEntity } from './issue-comment.entity';

@Entity('recon_issues')
export class IssueEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  runId: string;

  @ManyToOne(() => ReconciliationRunEntity, (r) => r.issues, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'runId' })
  run: ReconciliationRunEntity;

  @Column()
  title: string;

  @Column({ nullable: true, type: 'text' })
  body: string | null;

  @Column()
  createdById: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => IssueCommentEntity, (c) => c.issue, { cascade: true })
  comments: IssueCommentEntity[];
}
