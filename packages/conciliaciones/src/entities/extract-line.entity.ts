import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { bigintTransformer } from './bigint.transformer';
import { ReconciliationRunEntity } from './reconciliation-run.entity';
import { ExpenseCategoryEntity } from './expense-category.entity';
import { MatchEntity } from './match.entity';
import { UnmatchedExtractEntity } from './unmatched-extract.entity';

@Entity('extract_lines')
export class ExtractLineEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  runId: string;

  @ManyToOne(() => ReconciliationRunEntity, (r) => r.extractLines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'runId' })
  run: ReconciliationRunEntity;

  @Column({ nullable: true, type: 'timestamp' })
  date: Date | null;

  @Column({ type: 'varchar', nullable: true })
  concept: string | null;

  @Column({ type: 'float' })
  amount: number;

  @Column({ type: 'bigint', transformer: bigintTransformer })
  amountKey: bigint;

  @Column({ type: 'jsonb' })
  raw: Record<string, unknown>;

  @Column({ type: 'varchar', nullable: true })
  categoryId: string | null;

  @ManyToOne(() => ExpenseCategoryEntity, (c) => c.lines, { nullable: true })
  @JoinColumn({ name: 'categoryId' })
  category: ExpenseCategoryEntity | null;

  @Column({ default: false })
  excluded: boolean;

  @OneToMany(() => MatchEntity, (m) => m.extractLine)
  matchLines: MatchEntity[];

  @OneToOne(() => UnmatchedExtractEntity, (u) => u.extractLine)
  unmatched: UnmatchedExtractEntity | null;
}
