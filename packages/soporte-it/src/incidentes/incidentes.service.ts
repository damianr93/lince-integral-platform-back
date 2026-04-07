import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthUser, GlobalRole } from '@lince/types';
import { IncidenteEntity } from '../entities/incidente.entity';
import { EquiposService } from '../equipos/equipos.service';
import { CreateIncidenteDto } from './dto/create-incidente.dto';
import { UpdateIncidenteDto } from './dto/update-incidente.dto';

@Injectable()
export class IncidentesService {
  constructor(
    @InjectRepository(IncidenteEntity)
    private readonly incidentes: Repository<IncidenteEntity>,
    private readonly equiposService: EquiposService,
  ) {}

  /** Todos los incidentes — solo superadmin */
  findAll(): Promise<IncidenteEntity[]> {
    return this.incidentes.find({
      relations: ['equipo', 'reportadoPor', 'relevamiento'],
      order: { createdAt: 'DESC' },
    });
  }

  /** Incidentes de los equipos asignados al usuario */
  async findByUsuario(userId: string): Promise<IncidenteEntity[]> {
    return this.incidentes
      .createQueryBuilder('inc')
      .leftJoinAndSelect('inc.equipo', 'equipo')
      .leftJoinAndSelect('inc.reportadoPor', 'reportadoPor')
      .leftJoinAndSelect('inc.relevamiento', 'relevamiento')
      .where('equipo.usuarioPlatId = :userId', { userId })
      .orderBy('inc.createdAt', 'DESC')
      .getMany();
  }

  /** Incidentes de un equipo específico */
  findByEquipo(equipoId: string): Promise<IncidenteEntity[]> {
    return this.incidentes.find({
      where: { equipoId },
      relations: ['reportadoPor', 'relevamiento'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<IncidenteEntity> {
    const inc = await this.incidentes.findOne({
      where: { id },
      relations: ['equipo', 'equipo.usuarioPlat', 'reportadoPor', 'relevamiento'],
    });
    if (!inc) throw new NotFoundException(`Incidente ${id} no encontrado`);
    return inc;
  }

  async create(dto: CreateIncidenteDto, user: AuthUser): Promise<IncidenteEntity> {
    const equipo = await this.equiposService.findOne(dto.equipoId);

    // Un usuario normal solo puede reportar sobre sus propios equipos
    if (user.globalRole !== GlobalRole.SUPERADMIN) {
      if (equipo.usuarioPlatId !== user.id) {
        throw new ForbiddenException('Solo podés reportar incidentes de tus propios equipos');
      }
    }

    const maxResult = await this.incidentes
      .createQueryBuilder('i')
      .select('MAX(i.numeroReporte)', 'max')
      .getRawOne<{ max: number | null }>();
    const numeroReporte = (maxResult?.max ?? 0) + 1;

    const inc = this.incidentes.create({
      equipoId: dto.equipoId,
      reportadoPorId: user.id,
      descripcion: dto.descripcion,
      urgencia: dto.urgencia ?? 'media',
      estado: 'pending',
      numeroReporte,
      fechaReporte: dto.fechaReporte ? new Date(dto.fechaReporte) : new Date(),
      aplicacionesAfectadas: dto.aplicacionesAfectadas ?? null,
      accionesPrevias: dto.accionesPrevias ?? null,
    });
    return this.incidentes.save(inc);
  }

  async update(
    id: string,
    dto: UpdateIncidenteDto,
    user: AuthUser,
  ): Promise<IncidenteEntity> {
    if (user.globalRole !== GlobalRole.SUPERADMIN) {
      throw new ForbiddenException('Solo el superadmin puede actualizar el estado de incidentes');
    }
    const inc = await this.findOne(id);
    if (dto.estado) inc.estado = dto.estado;
    if (dto.reportadoPorId !== undefined) inc.reportadoPorId = dto.reportadoPorId;
    return this.incidentes.save(inc);
  }

  async remove(id: string, user: AuthUser): Promise<void> {
    if (user.globalRole !== GlobalRole.SUPERADMIN) {
      throw new ForbiddenException('Solo el superadmin puede eliminar incidentes');
    }
    const inc = await this.findOne(id);
    await this.incidentes.remove(inc);
  }
}
