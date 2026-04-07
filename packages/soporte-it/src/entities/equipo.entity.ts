import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  JoinColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '@lince/database';
import { IncidenteEntity } from './incidente.entity';

export type EstadoEquipo = 'activo' | 'en_reparacion' | 'baja';

@Entity('soporte_it_equipos')
export class EquipoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Número de activo (del Excel: columna "id") */
  @Column({ type: 'int', nullable: true })
  numeroActivo: number | null;

  /** Persona a cargo (del Excel: "A CARGO DE:") */
  @Column({ type: 'varchar', nullable: true })
  aCargoDe: string | null;

  /** Sector/departamento (del Excel: "SECTOR") */
  @Column({ type: 'varchar', nullable: true })
  sector: string | null;

  /** Hostname del equipo (del Excel: "NAME") */
  @Column({ type: 'varchar', nullable: true })
  hostname: string | null;

  /** Windows user/ID (del Excel: "USER_ID") */
  @Column({ type: 'varchar', nullable: true })
  windowsUserId: string | null;

  /** Fabricante (del Excel: "FABRICANTE") */
  @Column({ type: 'varchar', nullable: true })
  fabricante: string | null;

  /** Modelo (del Excel: "MODELO") */
  @Column({ type: 'varchar', nullable: true })
  modelo: string | null;

  /** RAM en GB (del Excel: "RAM_GB") */
  @Column({ type: 'varchar', nullable: true })
  ramGb: string | null;

  /** Sistema operativo (del Excel: "SO") */
  @Column({ type: 'text', nullable: true })
  sistemaOperativo: string | null;

  /** Procesador (del Excel: "PROCESADOR") */
  @Column({ type: 'text', nullable: true })
  procesador: string | null;

  /** Firmware UEFI/BIOS */
  @Column({ type: 'text', nullable: true })
  firmwareUefi: string | null;

  /** Tarjeta gráfica (del Excel: "GRAPHICS") */
  @Column({ type: 'text', nullable: true })
  graficos: string | null;

  /** Almacenamiento (del Excel: "ALMACENAMIENTO") */
  @Column({ type: 'text', nullable: true })
  almacenamiento: string | null;

  /** Adaptador de red (del Excel: "ADAPTADOR DE RED") */
  @Column({ type: 'text', nullable: true })
  adaptadorRed: string | null;

  /** IPv6 */
  @Column({ type: 'text', nullable: true })
  ipv6: string | null;

  /** Controlador de host USB */
  @Column({ type: 'text', nullable: true })
  controladorUsbHost: string | null;

  /** Estado del equipo */
  @Column({ type: 'varchar', default: 'activo' })
  estado: EstadoEquipo;

  /** Notas adicionales */
  @Column({ type: 'text', nullable: true })
  notas: string | null;

  /** Usuario de la plataforma asignado a este equipo (relación opcional) */
  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'usuarioPlatId' })
  usuarioPlat: UserEntity | null;

  @Column({ type: 'uuid', nullable: true })
  usuarioPlatId: string | null;

  @OneToMany(() => IncidenteEntity, (inc) => inc.equipo)
  incidentes: IncidenteEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
