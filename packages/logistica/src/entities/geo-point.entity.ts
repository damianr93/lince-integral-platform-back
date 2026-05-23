import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('geo_points')
export class GeoPointEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  carpeta: string;

  @Column()
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 7,
    transformer: { to: (v: number) => v, from: (v: string) => parseFloat(v) },
  })
  lat: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 7,
    transformer: { to: (v: number) => v, from: (v: string) => parseFloat(v) },
  })
  lng: number;

  @Column()
  iconFile: string;

  @Column({ default: 0 })
  orden: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
