import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EmpleadoEntity, Planta } from './empleado.entity';

export enum EstadoFichaje {
  ENTRADA = 0,
  SALIDA  = 1,
}

@Entity('asistencia_fichajes')
@Index(['pin', 'tiempo'])
@Index(['planta', 'tiempo'])
export class FichajeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Empleado resuelto por PIN — puede ser null si el PIN no está registrado */
  @ManyToOne(() => EmpleadoEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'empleado_id' })
  empleado: EmpleadoEntity | null;

  @Column({ name: 'empleado_id', type: 'uuid', nullable: true })
  empleadoId: string | null;

  /** PIN tal como llega del reloj */
  @Column()
  pin: string;

  /** Timestamp del fichaje (lo manda el reloj) */
  @Column({ type: 'timestamptz' })
  tiempo: Date;

  /** 0 = entrada, 1 = salida */
  @Column({ type: 'int', default: 0 })
  estado: EstadoFichaje;

  /** Método de verificación del reloj (0=contraseña, 1=huella, 4=cara, 15=biométrico) */
  @Column({ nullable: true, type: 'int' })
  verify: number | null;

  /** Serial number del dispositivo ZKTeco */
  @Column({ name: 'device_sn', nullable: true, type: 'varchar' })
  deviceSn: string | null;

  @Column({ type: 'enum', enum: Planta, nullable: true })
  planta: Planta | null;

  /** Payload crudo recibido del reloj, para auditoría */
  @Column({ name: 'raw_payload', type: 'text', nullable: true })
  rawPayload: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
