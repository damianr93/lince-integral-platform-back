import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmpleadoEntity, Planta } from '../entities/empleado.entity';
import { CreateEmpleadoDto } from './dto/create-empleado.dto';
import { UpdateEmpleadoDto } from './dto/update-empleado.dto';

const VILLA_NUEVA_SEED: { pin: string; firstName: string; lastName: string }[] = [
  { pin: '3',  firstName: 'Ramiro',         lastName: 'Alaniz' },
  { pin: '11', firstName: 'Maria Celeste',  lastName: 'Almada' },
  { pin: '7',  firstName: 'Julieta',        lastName: 'Calderon' },
  { pin: '21', firstName: 'Antonella Lucia',lastName: 'Corna' },
  { pin: '6',  firstName: 'Dalia',          lastName: 'Duriavichi' },
  { pin: '17', firstName: 'Ezequiel',       lastName: 'Fassi' },
  { pin: '9',  firstName: 'Gabriel',        lastName: 'Fernandez' },
  { pin: '2',  firstName: 'Leila',          lastName: 'Gasull' },
  { pin: '10', firstName: 'Luis',           lastName: 'Haedo' },
  { pin: '12', firstName: 'Luis',           lastName: 'Lujan' },
  { pin: '15', firstName: 'Florencia',      lastName: 'Micelli' },
  { pin: '1',  firstName: 'Micaela',        lastName: 'Negro' },
  { pin: '16', firstName: 'Omar',           lastName: 'Paviglianti' },
  { pin: '14', firstName: 'Jose',           lastName: 'Paz' },
  { pin: '5',  firstName: 'Luciana',        lastName: 'Rivera' },
  { pin: '19', firstName: 'Damian',         lastName: 'Rodriguez' },
  { pin: '8',  firstName: 'Simon',          lastName: 'Santa' },
  { pin: '18', firstName: 'Juan Cruz',      lastName: 'Sarno Finelli' },
  { pin: '13', firstName: 'Pablo',          lastName: 'Segura' },
  { pin: '20', firstName: 'Yoana Maricel',  lastName: 'Serrano' },
  { pin: '4',  firstName: 'Florencia',      lastName: 'Vottero' },
];

@Injectable()
export class EmployeesService {
  private readonly logger = new Logger(EmployeesService.name);

  constructor(
    @InjectRepository(EmpleadoEntity)
    private readonly repo: Repository<EmpleadoEntity>,
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

  async findByPin(pin: string): Promise<EmpleadoEntity | null> {
    return this.repo.findOne({ where: { pin: this.normalizePin(pin) } });
  }

  async create(dto: CreateEmpleadoDto): Promise<EmpleadoEntity> {
    const normalizedPin = this.normalizePin(dto.pin);
    const existing = await this.findByPinAnyVariant(normalizedPin);
    if (existing) throw new ConflictException(`El PIN ${dto.pin} ya está asignado a otro empleado`);
    return this.repo.save(this.repo.create({ ...dto, pin: normalizedPin, activo: dto.activo ?? true }));
  }

  async update(id: string, dto: UpdateEmpleadoDto): Promise<EmpleadoEntity> {
    const emp = await this.findOne(id);
    if (dto.pin && dto.pin !== emp.pin) {
      const normalizedPin = this.normalizePin(dto.pin);
      const conflict = await this.findByPinAnyVariant(normalizedPin);
      if (conflict) throw new ConflictException(`El PIN ${dto.pin} ya está asignado a otro empleado`);
      dto.pin = normalizedPin;
    }
    Object.assign(emp, dto);
    return this.repo.save(emp);
  }

  async remove(id: string): Promise<void> {
    const emp = await this.findOne(id);
    await this.repo.remove(emp);
  }

  async seedVillaNueva(): Promise<{ created: number; skipped: number }> {
    let created = 0;
    let skipped = 0;
    for (const seed of VILLA_NUEVA_SEED) {
      const normalizedPin = this.normalizePin(seed.pin);
      const existing = await this.findByPinAnyVariant(normalizedPin);
      if (existing) {
        this.logger.debug(`seedVillaNueva: PIN ${normalizedPin} ya existe (${existing.firstName} ${existing.lastName})`);
        skipped++;
        continue;
      }
      await this.repo.save(
        this.repo.create({
          pin: normalizedPin,
          firstName: seed.firstName,
          lastName: seed.lastName,
          planta: Planta.VILLA_NUEVA,
          activo: true,
        }),
      );
      this.logger.log(`seedVillaNueva: creado ${seed.firstName} ${seed.lastName} (PIN ${normalizedPin})`);
      created++;
    }
    this.logger.log(`seedVillaNueva: ${created} creados, ${skipped} ya existían`);
    return { created, skipped };
  }

  private normalizePin(pin: string): string {
    const trimmed = pin.trim();
    const withoutLeadingZeros = trimmed.replace(/^0+/, '');
    return withoutLeadingZeros.length > 0 ? withoutLeadingZeros : '0';
  }

  private async findByPinAnyVariant(pin: string): Promise<EmpleadoEntity | null> {
    const normalized = this.normalizePin(pin);
    const candidates = Array.from(new Set([pin, normalized, normalized.padStart(8, '0')]));
    return this.repo
      .createQueryBuilder('e')
      .where('e.pin IN (:...pins)', { pins: candidates })
      .getOne();
  }
}
