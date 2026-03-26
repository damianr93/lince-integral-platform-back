import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AreaEntity } from '@lince/database';
import { AreaDto } from '@lince/types';
import { CreateAreaDto } from './dto/create-area.dto';
import { UpdateAreaDto } from './dto/update-area.dto';

@Injectable()
export class AreasService {
  constructor(
    @InjectRepository(AreaEntity)
    private readonly areas: Repository<AreaEntity>,
  ) {}

  async findAll(): Promise<AreaDto[]> {
    const list = await this.areas.find({ order: { name: 'ASC' } });
    return list.map(this.toDto);
  }

  async findOne(id: string): Promise<AreaDto> {
    const area = await this.areas.findOne({ where: { id } });
    if (!area) throw new NotFoundException(`Área ${id} no encontrada`);
    return this.toDto(area);
  }

  async create(dto: CreateAreaDto): Promise<AreaDto> {
    const existing = await this.areas.findOne({ where: { name: dto.name } });
    if (existing) throw new ConflictException('Ya existe un área con ese nombre');
    const area = this.areas.create({ name: dto.name, modules: dto.modules ?? {} });
    const saved = await this.areas.save(area);
    return this.toDto(saved);
  }

  async update(id: string, dto: UpdateAreaDto): Promise<AreaDto> {
    const area = await this.areas.findOne({ where: { id } });
    if (!area) throw new NotFoundException(`Área ${id} no encontrada`);
    if (dto.name && dto.name !== area.name) {
      const conflict = await this.areas.findOne({ where: { name: dto.name } });
      if (conflict) throw new ConflictException('Ya existe un área con ese nombre');
    }
    Object.assign(area, dto);
    const saved = await this.areas.save(area);
    return this.toDto(saved);
  }

  async remove(id: string): Promise<void> {
    const area = await this.areas.findOne({ where: { id } });
    if (!area) throw new NotFoundException(`Área ${id} no encontrada`);
    await this.areas.remove(area);
  }

  private toDto(area: AreaEntity): AreaDto {
    return {
      id: area.id,
      name: area.name,
      modules: area.modules,
      createdAt: area.createdAt.toISOString(),
      updatedAt: area.updatedAt.toISOString(),
    };
  }
}
