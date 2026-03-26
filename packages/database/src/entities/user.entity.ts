import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { GlobalRole, UserModules } from '@lince/types';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column({ select: false })
  passwordHash: string;

  @Column({
    type: 'enum',
    enum: GlobalRole,
    default: GlobalRole.USER,
  })
  globalRole: GlobalRole;

  @Column({ type: 'jsonb', default: {} })
  modules: UserModules;

  @Column({ default: true })
  active: boolean;

  @Column({ type: 'varchar', nullable: true })
  area: string | null;

  /** Set to true after an admin resets the password. Forces the user to change it on next login. */
  @Column({ default: false })
  mustChangePassword: boolean;

  /**
   * Stores the bcrypt hash of the current refresh token.
   * Null when the user is logged out. Used for refresh token rotation.
   */
  @Column({ type: 'varchar', nullable: true, select: false })
  refreshTokenHash: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
