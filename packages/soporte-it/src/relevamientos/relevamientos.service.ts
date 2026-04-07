import {
  ForbiddenException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthUser, GlobalRole } from '@lince/types';
import { RelevamientoEntity } from '../entities/relevamiento.entity';
import { RelevamientoItemEntity } from '../entities/relevamiento-item.entity';
import { IncidentesService } from '../incidentes/incidentes.service';
import { CreateRelevamientoDto } from './dto/create-relevamiento.dto';
import { UpdateRelevamientoDto } from './dto/update-relevamiento.dto';

@Injectable()
export class RelevamientosService {
  constructor(
    @InjectRepository(RelevamientoEntity)
    private readonly relevamientos: Repository<RelevamientoEntity>,
    @InjectRepository(RelevamientoItemEntity)
    private readonly items: Repository<RelevamientoItemEntity>,
    private readonly incidentesService: IncidentesService,
  ) {}

  async findOne(id: string): Promise<RelevamientoEntity> {
    const rel = await this.relevamientos.findOne({
      where: { id },
      relations: ['incidente', 'incidente.equipo', 'incidente.reportadoPor', 'creadoPor', 'items'],
      order: { items: { orden: 'ASC' } },
    });
    if (!rel) throw new NotFoundException(`Relevamiento ${id} no encontrado`);
    return rel;
  }

  async findByIncidente(incidenteId: string): Promise<RelevamientoEntity | null> {
    return this.relevamientos.findOne({
      where: { incidenteId },
      relations: ['incidente', 'incidente.equipo', 'incidente.reportadoPor', 'creadoPor', 'items'],
      order: { items: { orden: 'ASC' } },
    });
  }

  private async assertCanReadIncidente(incidenteId: string, user: AuthUser): Promise<void> {
    if (user.globalRole === GlobalRole.SUPERADMIN) return;
    const incidente = await this.incidentesService.findOne(incidenteId);
    if (incidente.equipo?.usuarioPlatId !== user.id) {
      throw new ForbiddenException('No tenés acceso a este relevamiento');
    }
  }

  async findOneForUser(id: string, user: AuthUser): Promise<RelevamientoEntity> {
    const rel = await this.findOne(id);
    await this.assertCanReadIncidente(rel.incidenteId, user);
    return rel;
  }

  async findByIncidenteForUser(
    incidenteId: string,
    user: AuthUser,
  ): Promise<RelevamientoEntity | null> {
    await this.assertCanReadIncidente(incidenteId, user);
    return this.findByIncidente(incidenteId);
  }

  async create(
    dto: CreateRelevamientoDto,
    user: AuthUser,
  ): Promise<RelevamientoEntity> {
    // Verificar que el incidente existe
    await this.incidentesService.findOne(dto.incidenteId);

    // Solo puede haber un relevamiento por incidente
    const existing = await this.relevamientos.findOne({
      where: { incidenteId: dto.incidenteId },
    });
    if (existing) {
      throw new ConflictException(
        'Ya existe un relevamiento para este incidente. Use PATCH para editarlo.',
      );
    }

    const rel = this.relevamientos.create({
      incidenteId: dto.incidenteId,
      creadoPorId: user.id,
      fecha: dto.fecha ?? new Date().toISOString().slice(0, 10),
      modalidad: dto.modalidad ?? null,
      conclusionGeneral: dto.conclusionGeneral ?? null,
      pasosASeguir: dto.pasosASeguir ?? null,
      recomendaciones: dto.recomendaciones ?? null,
    });

    const saved = await this.relevamientos.save(rel);

    if (dto.items?.length) {
      const itemEntities = dto.items.map((item) =>
        this.items.create({
          relevamientoId: saved.id,
          orden: item.orden,
          titulo: item.titulo,
          procedimiento: item.procedimiento ?? null,
          observacion: item.observacion ?? null,
          conclusion: item.conclusion ?? null,
        }),
      );
      await this.items.save(itemEntities);
    }

    return this.findOne(saved.id);
  }

  async update(
    id: string,
    dto: UpdateRelevamientoDto,
  ): Promise<RelevamientoEntity> {
    const rel = await this.findOne(id);

    Object.assign(rel, {
      ...(dto.fecha !== undefined && { fecha: dto.fecha }),
      ...(dto.modalidad !== undefined && { modalidad: dto.modalidad }),
      ...(dto.conclusionGeneral !== undefined && { conclusionGeneral: dto.conclusionGeneral }),
      ...(dto.pasosASeguir !== undefined && { pasosASeguir: dto.pasosASeguir }),
      ...(dto.recomendaciones !== undefined && { recomendaciones: dto.recomendaciones }),
    });

    await this.relevamientos.save(rel);

    if (dto.items !== undefined) {
      // Reemplazar todos los ítems
      await this.items.delete({ relevamientoId: id });
      if (dto.items.length) {
        const itemEntities = dto.items.map((item) =>
          this.items.create({
            relevamientoId: id,
            orden: item.orden,
            titulo: item.titulo,
            procedimiento: item.procedimiento ?? null,
            observacion: item.observacion ?? null,
            conclusion: item.conclusion ?? null,
          }),
        );
        await this.items.save(itemEntities);
      }
    }

    return this.findOne(id);
  }
}
