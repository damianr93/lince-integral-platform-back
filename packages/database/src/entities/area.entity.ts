import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserModules } from '@lince/types';

@Entity('areas')
export class AreaEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  /** Default module permissions granted to users assigned to this area */
  @Column({ type: 'jsonb', default: {} })
  modules: UserModules;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
