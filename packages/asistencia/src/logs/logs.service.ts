import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { FichajeEntity, EstadoFichaje } from '../entities/fichaje.entity';
import { Planta } from '../entities/empleado.entity';

export interface FichajesFilter {
  planta?:     Planta;
  empleadoId?: string;
  pin?:        string;
  desde?:      Date;
  hasta?:      Date;
  estado?:     EstadoFichaje;
  page?:       number;
  limit?:      number;
}

@Injectable()
export class LogsService {
  constructor(
    @InjectRepository(FichajeEntity)
    private readonly repo: Repository<FichajeEntity>,
  ) {}

  async findAll(filter: FichajesFilter = {}): Promise<{ items: FichajeEntity[]; total: number }> {
    const { planta, empleadoId, pin, desde, hasta, estado, page = 1, limit = 50 } = filter;

    const qb = this.repo
      .createQueryBuilder('f')
      .leftJoinAndSelect('f.empleado', 'e')
      .orderBy('f.tiempo', 'DESC');

    if (planta)     qb.andWhere('f.planta = :planta', { planta });
    if (empleadoId) qb.andWhere('f.empleadoId = :empleadoId', { empleadoId });
    if (pin)        qb.andWhere('f.pin = :pin', { pin });
    if (estado !== undefined) qb.andWhere('f.estado = :estado', { estado });

    if (desde && hasta) {
      qb.andWhere('f.tiempo BETWEEN :desde AND :hasta', { desde, hasta });
    } else if (desde) {
      qb.andWhere('f.tiempo >= :desde', { desde });
    } else if (hasta) {
      qb.andWhere('f.tiempo <= :hasta', { hasta });
    }

    const [items, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { items, total };
  }

  async findToday(planta?: Planta): Promise<FichajeEntity[]> {
    const hoy = new Date();
    const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 0, 0, 0);
    const fin    = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59);

    const qb = this.repo
      .createQueryBuilder('f')
      .leftJoinAndSelect('f.empleado', 'e')
      .where('f.tiempo BETWEEN :inicio AND :fin', { inicio, fin })
      .orderBy('f.tiempo', 'ASC');

    if (planta) qb.andWhere('f.planta = :planta', { planta });

    return qb.getMany();
  }

  async findByEmployee(empleadoId: string, limit = 100): Promise<FichajeEntity[]> {
    return this.repo.find({
      where: { empleadoId },
      order: { tiempo: 'DESC' },
      take: limit,
      relations: ['empleado'],
    });
  }

  /** Último fichaje de cada PIN hoy — para determinar quién está en planta */
  async getLastPunchesPerPin(planta?: Planta): Promise<FichajeEntity[]> {
    const hoy = new Date();
    const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 0, 0, 0);

    const sub = this.repo
      .createQueryBuilder('f2')
      .select('MAX(f2.tiempo)', 'maxTime')
      .addSelect('f2.pin', 'pin')
      .where('f2.tiempo >= :inicio', { inicio })
      .groupBy('f2.pin');

    if (planta) sub.andWhere('f2.planta = :planta', { planta });

    const qb = this.repo
      .createQueryBuilder('f')
      .leftJoinAndSelect('f.empleado', 'e')
      .innerJoin(
        `(${sub.getQuery()})`,
        'last',
        'f.pin = last.pin AND f.tiempo = last."maxTime"',
      )
      .setParameters(sub.getParameters());

    if (planta) qb.andWhere('f.planta = :planta', { planta });

    return qb.getMany();
  }
}
