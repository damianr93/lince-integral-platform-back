import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '@lince/database';
import { IncidenteEntity } from './incidente.entity';
import { RelevamientoItemEntity } from './relevamiento-item.entity';

@Entity('soporte_it_relevamientos')
export class RelevamientoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Incidente al que pertenece este relevamiento (1-1) */
  @OneToOne(() => IncidenteEntity, (i) => i.relevamiento, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'incidenteId' })
  incidente: IncidenteEntity;

  @Column({ type: 'uuid' })
  incidenteId: string;

  /** Técnico que realizó el relevamiento */
  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'creadoPorId' })
  creadoPor: UserEntity | null;

  @Column({ type: 'uuid', nullable: true })
  creadoPorId: string | null;

  /** Fecha del relevamiento */
  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  fecha: string;

  /** Modalidad: "Presencial" | "Acceso remoto via AnyDesk" | etc. */
  @Column({ type: 'varchar', nullable: true })
  modalidad: string | null;

  /** Conclusión general del relevamiento */
  @Column({ type: 'text', nullable: true })
  conclusionGeneral: string | null;

  /** Pasos a seguir / seguimiento recomendado */
  @Column({ type: 'text', nullable: true })
  pasosASeguir: string | null;

  /** Recomendaciones adicionales */
  @Column({ type: 'text', nullable: true })
  recomendaciones: string | null;

  /** Ítems dinámicos del diagnóstico */
  @OneToMany(() => RelevamientoItemEntity, (item) => item.relevamiento, {
    cascade: true,
    eager: false,
  })
  items: RelevamientoItemEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
