import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EquipoEntity } from '../entities/equipo.entity';
import { CreateEquipoDto } from './dto/create-equipo.dto';
import { UpdateEquipoDto } from './dto/update-equipo.dto';

@Injectable()
export class EquiposService {
  constructor(
    @InjectRepository(EquipoEntity)
    private readonly equipos: Repository<EquipoEntity>,
  ) {}

  findAll(): Promise<EquipoEntity[]> {
    return this.equipos.find({
      relations: ['usuarioPlat'],
      order: { numeroActivo: 'ASC' },
    });
  }

  /** Equipos asignados a un usuario de la plataforma */
  findByUsuario(usuarioPlatId: string): Promise<EquipoEntity[]> {
    return this.equipos.find({
      where: { usuarioPlatId },
      order: { numeroActivo: 'ASC' },
    });
  }

  async findOne(id: string): Promise<EquipoEntity> {
    const equipo = await this.equipos.findOne({
      where: { id },
      relations: ['usuarioPlat', 'incidentes'],
    });
    if (!equipo) throw new NotFoundException(`Equipo ${id} no encontrado`);
    return equipo;
  }

  async create(dto: CreateEquipoDto): Promise<EquipoEntity> {
    const equipo = this.equipos.create({
      numeroActivo: dto.numeroActivo ?? null,
      aCargoDe: dto.aCargoDe ?? null,
      sector: dto.sector ?? null,
      hostname: dto.hostname ?? null,
      windowsUserId: dto.windowsUserId ?? null,
      fabricante: dto.fabricante ?? null,
      modelo: dto.modelo ?? null,
      ramGb: dto.ramGb ?? null,
      sistemaOperativo: dto.sistemaOperativo ?? null,
      procesador: dto.procesador ?? null,
      firmwareUefi: dto.firmwareUefi ?? null,
      graficos: dto.graficos ?? null,
      almacenamiento: dto.almacenamiento ?? null,
      adaptadorRed: dto.adaptadorRed ?? null,
      ipv6: dto.ipv6 ?? null,
      controladorUsbHost: dto.controladorUsbHost ?? null,
      estado: dto.estado ?? 'activo',
      notas: dto.notas ?? null,
      usuarioPlatId: dto.usuarioPlatId ?? null,
    });
    return this.equipos.save(equipo);
  }

  async update(id: string, dto: UpdateEquipoDto): Promise<EquipoEntity> {
    const equipo = await this.findOne(id);
    Object.assign(equipo, {
      ...(dto.numeroActivo !== undefined && { numeroActivo: dto.numeroActivo }),
      ...(dto.aCargoDe !== undefined && { aCargoDe: dto.aCargoDe }),
      ...(dto.sector !== undefined && { sector: dto.sector }),
      ...(dto.hostname !== undefined && { hostname: dto.hostname }),
      ...(dto.windowsUserId !== undefined && { windowsUserId: dto.windowsUserId }),
      ...(dto.fabricante !== undefined && { fabricante: dto.fabricante }),
      ...(dto.modelo !== undefined && { modelo: dto.modelo }),
      ...(dto.ramGb !== undefined && { ramGb: dto.ramGb }),
      ...(dto.sistemaOperativo !== undefined && { sistemaOperativo: dto.sistemaOperativo }),
      ...(dto.procesador !== undefined && { procesador: dto.procesador }),
      ...(dto.firmwareUefi !== undefined && { firmwareUefi: dto.firmwareUefi }),
      ...(dto.graficos !== undefined && { graficos: dto.graficos }),
      ...(dto.almacenamiento !== undefined && { almacenamiento: dto.almacenamiento }),
      ...(dto.adaptadorRed !== undefined && { adaptadorRed: dto.adaptadorRed }),
      ...(dto.ipv6 !== undefined && { ipv6: dto.ipv6 }),
      ...(dto.controladorUsbHost !== undefined && { controladorUsbHost: dto.controladorUsbHost }),
      ...(dto.estado !== undefined && { estado: dto.estado }),
      ...(dto.notas !== undefined && { notas: dto.notas }),
      ...(dto.usuarioPlatId !== undefined && { usuarioPlatId: dto.usuarioPlatId ?? null }),
    });
    return this.equipos.save(equipo);
  }

  async remove(id: string): Promise<void> {
    const equipo = await this.findOne(id);
    await this.equipos.remove(equipo);
  }
}
