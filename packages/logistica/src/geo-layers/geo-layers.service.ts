import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GeoPointEntity } from '../entities/geo-point.entity';
import { UpsertGeoPointDto } from './dto/upsert-geo-point.dto';

export interface GeoLayer {
  carpeta: string;
  iconFile: string;
  points: GeoPointEntity[];
}

@Injectable()
export class GeoLayersService {
  constructor(
    @InjectRepository(GeoPointEntity)
    private readonly repo: Repository<GeoPointEntity>,
  ) {}

  async findAll(): Promise<GeoLayer[]> {
    const points = await this.repo.find({ order: { carpeta: 'ASC', orden: 'ASC', nombre: 'ASC' } });

    const map = new Map<string, GeoLayer>();
    for (const point of points) {
      if (!map.has(point.carpeta)) {
        map.set(point.carpeta, { carpeta: point.carpeta, iconFile: point.iconFile, points: [] });
      }
      map.get(point.carpeta)!.points.push(point);
    }

    return Array.from(map.values());
  }

  async create(dto: UpsertGeoPointDto): Promise<GeoPointEntity> {
    const point = this.repo.create({
      ...dto,
      descripcion: dto.descripcion ?? null,
    });
    return this.repo.save(point);
  }

  async update(id: string, dto: Partial<UpsertGeoPointDto>): Promise<GeoPointEntity> {
    const point = await this.repo.findOneBy({ id });
    if (!point) throw new NotFoundException('Punto geográfico no encontrado');

    Object.assign(point, dto);
    if (dto.descripcion === undefined) point.descripcion = point.descripcion; // TODO-7 [FÁCIL]: ¿esta línea hace algo? Si no, ¿qué debería hacer?
    return this.repo.save(point);
  }

  async remove(id: string): Promise<void> {
    const point = await this.repo.findOneBy({ id });
    if (!point) throw new NotFoundException('Punto geográfico no encontrado');
    await this.repo.remove(point);
  }
}
