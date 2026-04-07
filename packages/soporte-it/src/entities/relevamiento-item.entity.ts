import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RelevamientoEntity } from './relevamiento.entity';

@Entity('soporte_it_relevamiento_items')
export class RelevamientoItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RelevamientoEntity, (r) => r.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'relevamientoId' })
  relevamiento: RelevamientoEntity;

  @Column({ type: 'uuid' })
  relevamientoId: string;

  /** Orden de aparición del ítem en el informe */
  @Column({ type: 'int', default: 0 })
  orden: number;

  /** Título de la sección (ej: "Visor de eventos (Event Viewer)") */
  @Column({ type: 'varchar' })
  titulo: string;

  /** Procedimiento o comando ejecutado */
  @Column({ type: 'text', nullable: true })
  procedimiento: string | null;

  /** Observación del técnico */
  @Column({ type: 'text', nullable: true })
  observacion: string | null;

  /** Conclusión parcial de este ítem */
  @Column({ type: 'text', nullable: true })
  conclusion: string | null;
}
