import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ReconciliationRunEntity } from './reconciliation-run.entity';

@Entity('recon_messages')
export class MessageEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  runId: string;

  @ManyToOne(() => ReconciliationRunEntity, (r) => r.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'runId' })
  run: ReconciliationRunEntity;

  @Column()
  authorId: string;

  @Column({ type: 'text' })
  body: string;

  @CreateDateColumn()
  createdAt: Date;
}
