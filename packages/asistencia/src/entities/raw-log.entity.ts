import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('asistencia_raw_logs')
export class RawLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  method: string;

  @Column()
  path: string;

  @Column({ type: 'jsonb', nullable: true })
  headers: Record<string, string> | null;

  @Column({ name: 'query_params', type: 'jsonb', nullable: true })
  queryParams: Record<string, string> | null;

  @Column({ name: 'body_raw', type: 'text', nullable: true })
  bodyRaw: string | null;

  @Column({ name: 'body_parsed', type: 'jsonb', nullable: true })
  bodyParsed: Record<string, unknown> | null;

  @Column({ name: 'device_sn', nullable: true, type: 'varchar' })
  deviceSn: string | null;

  @Column({ name: 'ip', nullable: true, type: 'varchar' })
  ip: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
