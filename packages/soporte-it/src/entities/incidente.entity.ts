import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '@lince/database';
import { EquipoEntity } from './equipo.entity';
import { RelevamientoEntity } from './relevamiento.entity';

export type UrgenciaIncidente = 'baja' | 'media' | 'alta';
export type EstadoIncidente = 'pending' | 'in_progress' | 'resolved';

@Entity('soporte_it_incidentes')
export class IncidenteEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Número de reporte secuencial visible al usuario (asignado por el service) */
  @Column({ type: 'int', default: 0 })
  numeroReporte: number;

  /** Equipo afectado */
  @ManyToOne(() => EquipoEntity, (e) => e.incidentes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'equipoId' })
  equipo: EquipoEntity;

  @Column({ type: 'uuid' })
  equipoId: string;

  /** Usuario que reportó el incidente */
  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reportadoPorId' })
  reportadoPor: UserEntity | null;

  @Column({ type: 'uuid', nullable: true })
  reportadoPorId: string | null;

  /** Descripción libre del problema */
  @Column({ type: 'text' })
  descripcion: string;

  /** Urgencia percibida por el usuario */
  @Column({ type: 'varchar', default: 'media' })
  urgencia: UrgenciaIncidente;

  /** Estado del flujo */
  @Column({ type: 'varchar', default: 'pending' })
  estado: EstadoIncidente;

  /** Fecha en que ocurrió/se notó el problema (editable) */
  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  fechaReporte: Date;

  /** Aplicaciones afectadas (opcional) */
  @Column({ type: 'text', nullable: true })
  aplicacionesAfectadas: string | null;

  /** Acciones previas realizadas por el usuario */
  @Column({ type: 'text', nullable: true })
  accionesPrevias: string | null;

  /** Relevamiento técnico asociado (creado por superadmin) */
  @OneToOne(() => RelevamientoEntity, (r) => r.incidente, { nullable: true })
  relevamiento: RelevamientoEntity | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
