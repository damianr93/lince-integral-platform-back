import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmpleadoEntity, Planta } from '../entities/empleado.entity';
import { CreateEmpleadoDto } from './dto/create-empleado.dto';
import { UpdateEmpleadoDto } from './dto/update-empleado.dto';

@Injectable()
export class EmployeesService {
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
    return this.repo.findOne({ where: { pin } });
  }

  async create(dto: CreateEmpleadoDto): Promise<EmpleadoEntity> {
    const existing = await this.repo.findOne({ where: { pin: dto.pin } });
    if (existing) throw new ConflictException(`El PIN ${dto.pin} ya está asignado a otro empleado`);
    return this.repo.save(this.repo.create({ ...dto, activo: dto.activo ?? true }));
  }

  async update(id: string, dto: UpdateEmpleadoDto): Promise<EmpleadoEntity> {
    const emp = await this.findOne(id);
    if (dto.pin && dto.pin !== emp.pin) {
      const conflict = await this.repo.findOne({ where: { pin: dto.pin } });
      if (conflict) throw new ConflictException(`El PIN ${dto.pin} ya está asignado a otro empleado`);
    }
    Object.assign(emp, dto);
    return this.repo.save(emp);
  }

  async remove(id: string): Promise<void> {
    const emp = await this.findOne(id);
    await this.repo.remove(emp);
  }
}
