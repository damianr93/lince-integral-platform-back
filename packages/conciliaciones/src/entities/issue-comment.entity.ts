import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { IssueEntity } from './issue.entity';

@Entity('recon_issue_comments')
export class IssueCommentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  issueId: string;

  @ManyToOne(() => IssueEntity, (i) => i.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'issueId' })
  issue: IssueEntity;

  @Column()
  authorId: string;

  @Column({ type: 'text' })
  body: string;

  @CreateDateColumn()
  createdAt: Date;
}
