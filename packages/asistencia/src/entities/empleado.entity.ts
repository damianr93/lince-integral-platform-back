import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum Planta {
  TUCUMAN    = 'tucuman',
  VILLA_NUEVA = 'villa_nueva',
}

@Entity('asistencia_empleados')
export class EmpleadoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column({ nullable: true, type: 'varchar' })
  dni: string | null;

  /** ID numérico registrado en el reloj ZKTeco (campo PIN del dispositivo) */
  @Index({ unique: true })
  @Column()
  pin: string;

  @Column({ type: 'enum', enum: Planta })
  planta: Planta;

  @Column({ nullable: true, type: 'varchar' })
  departamento: string | null;

  @Column({ nullable: true, type: 'varchar' })
  cargo: string | null;

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
