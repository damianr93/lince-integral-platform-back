import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmpleadoEntity, Planta } from '../entities/empleado.entity';
import { FichajeEntity } from '../entities/fichaje.entity';
import { CreateEmpleadoDto } from './dto/create-empleado.dto';
import { UpdateEmpleadoDto } from './dto/update-empleado.dto';

@Injectable()
export class EmployeesService {
  private readonly logger = new Logger(EmployeesService.name);

  constructor(
    @InjectRepository(EmpleadoEntity)
    private readonly repo: Repository<EmpleadoEntity>,
    @InjectRepository(FichajeEntity)
    private readonly fichajes: Repository<FichajeEntity>,
  ) {}

  async findAll(planta?: Planta, soloActivos = false): Promise<EmpleadoEntity[]> {
    const qb = this.repo.createQueryBuilder('e').orderBy('e.lastName').addOrderBy('e.firstName');
    if (planta)      qb.andWhere('e.planta = :planta', { planta });
    if (soloActivos) qb.andWhere('e.activo = true');
    return qb.getMany();
  }

  async findOne(id: string): Promise<EmpleadoEntity> {
    const emp = await this.repo.findOne({ where: { id } });
    if (!emp) throw new NotFoundException(`Empleado ${id} no encontrado`);
    return emp;
  }

  async create(dto: CreateEmpleadoDto): Promise<EmpleadoEntity> {
    const normalizedPin = this.normalizePin(dto.pin);
    const existing = await this.findByPinPlanta(normalizedPin, dto.planta);
    if (existing) throw new ConflictException(`El PIN ${dto.pin} ya está asignado a otro empleado en ${dto.planta}`);
    const saved = await this.repo.save(this.repo.create({ ...dto, pin: normalizedPin, activo: dto.activo ?? true }));
    await this.linkOrphanFichajes(saved);
    return saved;
  }

  async update(id: string, dto: UpdateEmpleadoDto): Promise<EmpleadoEntity> {
    const emp = await this.findOne(id);
    if (dto.pin && dto.pin !== emp.pin) {
      const normalizedPin = this.normalizePin(dto.pin);
      const targetPlanta = dto.planta ?? emp.planta;
      const conflict = await this.findByPinPlanta(normalizedPin, targetPlanta);
      if (conflict && conflict.id !== id) throw new ConflictException(`El PIN ${dto.pin} ya está asignado a otro empleado en ${targetPlanta}`);
      dto.pin = normalizedPin;
    }
    Object.assign(emp, dto);
    const saved = await this.repo.save(emp);
    await this.linkOrphanFichajes(saved);
    return saved;
  }

  /**
   * Asocia automáticamente todos los fichajes huérfanos (empleado_id IS NULL) que coincidan
   * con el PIN+planta del empleado. Compara el PIN ya normalizado para tolerar leading-zeros
   * (el reloj puede mandar "1", "001", "00000001" — todo eso debe matchear con emp.pin="1").
   */
  private async linkOrphanFichajes(emp: EmpleadoEntity): Promise<void> {
    const normalized = this.normalizePin(emp.pin);
    const result = await this.fichajes
      .createQueryBuilder()
      .update(FichajeEntity)
      .set({ empleadoId: emp.id })
      .where('empleado_id IS NULL')
      .andWhere('planta = :planta', { planta: emp.planta })
      .andWhere(`regexp_replace(pin, '^0+', '') = :pin`, { pin: normalized })
      .execute();
    const updated = result.affected ?? 0;
    if (updated > 0) {
      this.logger.log(
        `linkOrphanFichajes: ${updated} fichaje(s) asociados a ${emp.firstName} ${emp.lastName} (PIN=${normalized}, planta=${emp.planta})`,
      );
    } else {
      this.logger.debug(
        `linkOrphanFichajes: sin fichajes huérfanos para PIN=${normalized} planta=${emp.planta}`,
      );
    }
  }

  async remove(id: string): Promise<void> {
    const emp = await this.findOne(id);
    await this.repo.remove(emp);
  }

  private normalizePin(pin: string): string {
    const trimmed = pin.trim();
    const withoutLeadingZeros = trimmed.replace(/^0+/, '');
    return withoutLeadingZeros.length > 0 ? withoutLeadingZeros : '0';
  }

  private async findByPinPlanta(pin: string, planta: Planta): Promise<EmpleadoEntity | null> {
    const normalized = this.normalizePin(pin);
    const candidates = Array.from(new Set([pin, normalized, normalized.padStart(8, '0')]));
    return this.repo
      .createQueryBuilder('e')
      .where('e.pin IN (:...pins)', { pins: candidates })
      .andWhere('e.planta = :planta', { planta })
      .getOne();
  }
}
