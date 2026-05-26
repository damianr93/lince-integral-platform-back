import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { FichajeEntity, EstadoFichaje } from '../entities/fichaje.entity';
import { EmpleadoEntity, Planta } from '../entities/empleado.entity';

const FECHA_YMD = /^\d{4}-\d{2}-\d{2}$/;

export interface FichajesFilter {
  planta?:     Planta;
  empleadoId?: string;
  pin?:        string;
  nombre?:     string;
  fechaDia?:   string;
  desde?:      Date;
  hasta?:      Date;
  estado?:     EstadoFichaje;
  page?:       number;
  limit?:      number;
}

export interface PinSummaryRow {
  pin: string;
  planta: Planta;
  totalFichajes: number;
  ultimoFichaje: string | null;
  empleadoId: string | null;
  empleadoNombre: string | null;
  empleadoPlanta: Planta | null;
}

export interface UpdateFichajeInput {
  estado?: EstadoFichaje;
  tiempo?: Date;
  empleadoId?: string | null;
}

@Injectable()
export class LogsService {
  private readonly logger = new Logger(LogsService.name);

  constructor(
    @InjectRepository(FichajeEntity)
    private readonly repo: Repository<FichajeEntity>,
    @InjectRepository(EmpleadoEntity)
    private readonly empleadoRepo: Repository<EmpleadoEntity>,
  ) {}

  async findAll(filter: FichajesFilter = {}): Promise<{ items: FichajeEntity[]; total: number }> {
    const fechaDia = filter.fechaDia?.trim();
    if (fechaDia) {
      return this.findAllForCalendarDay({ ...filter, fechaDia });
    }

    const { desde, hasta, page = 1, limit = 50 } = filter;
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(200, Math.max(1, Number(limit) || 50));

    const qb = this.repo
      .createQueryBuilder('f')
      .leftJoinAndSelect('f.empleado', 'e')
      .orderBy('f.tiempo', 'DESC');

    this.applyCommonFichajesFilters(qb, filter);

    if (desde && hasta) {
      qb.andWhere('f.tiempo BETWEEN :desde AND :hasta', { desde, hasta });
    } else if (desde) {
      qb.andWhere('f.tiempo >= :desde', { desde });
    } else if (hasta) {
      qb.andWhere('f.tiempo <= :hasta', { hasta });
    }

    const [items, total] = await qb
      .skip((pageNum - 1) * limitNum)
      .take(limitNum)
      .getManyAndCount();

    return { items, total };
  }

  private applyCommonFichajesFilters(
    qb: SelectQueryBuilder<FichajeEntity>,
    filter: Pick<FichajesFilter, 'planta' | 'empleadoId' | 'pin' | 'nombre' | 'estado'>,
  ): void {
    const { planta, empleadoId, pin, nombre, estado } = filter;
    if (planta) qb.andWhere('f.planta = :planta', { planta });
    if (empleadoId) qb.andWhere('f.empleadoId = :empleadoId', { empleadoId });
    if (pin) qb.andWhere('f.pin = :pin', { pin });
    if (estado !== undefined) qb.andWhere('f.estado = :estado', { estado });

    const nombreTrim = nombre?.trim();
    if (nombreTrim) {
      const tokens = nombreTrim.toLowerCase().split(/\s+/).filter(Boolean);
      const fullNameExpr =
        "LOWER(TRIM(CONCAT(COALESCE(e.first_name, ''), ' ', COALESCE(e.last_name, ''))))";
      qb.andWhere('e.id IS NOT NULL');
      tokens.forEach((token, i) => {
        qb.andWhere(`${fullNameExpr} LIKE :nombreTok${i}`, { [`nombreTok${i}`]: `%${token}%` });
      });
    }
  }

  private nextCalendarDayYmd(ymd: string): string {
    const [y, m, d] = ymd.split('-').map((s) => parseInt(s, 10));
    const dt = new Date(Date.UTC(y, m - 1, d));
    dt.setUTCDate(dt.getUTCDate() + 1);
    const yy = dt.getUTCFullYear();
    const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(dt.getUTCDate()).padStart(2, '0');
    return `${yy}-${mm}-${dd}`;
  }

  private async findAllForCalendarDay(
    filter: FichajesFilter & { fechaDia: string },
  ): Promise<{ items: FichajeEntity[]; total: number }> {
    const { fechaDia } = filter;
    if (!FECHA_YMD.test(fechaDia)) {
      throw new BadRequestException('fecha debe ser YYYY-MM-DD');
    }
    const finYmd = this.nextCalendarDayYmd(fechaDia);

    const qb = this.repo
      .createQueryBuilder('f')
      .leftJoinAndSelect('f.empleado', 'e')
      .orderBy('f.tiempo', 'DESC');

    this.applyCommonFichajesFilters(qb, filter);

    // `tiempo` se guarda como instante UTC; RRHH filtra por día calendario Argentina.
    qb.andWhere(
      "f.tiempo >= (:dayStart::timestamp AT TIME ZONE 'America/Argentina/Buenos_Aires')" +
        " AND f.tiempo < (:dayEnd::timestamp AT TIME ZONE 'America/Argentina/Buenos_Aires')",
      {
        dayStart: `${fechaDia} 00:00:00`,
        dayEnd: `${finYmd} 00:00:00`,
      },
    );

    const maxRows = 10000;
    const [items, total] = await qb.take(maxRows).getManyAndCount();
    return { items, total };
  }

  async updateById(id: string, input: UpdateFichajeInput): Promise<FichajeEntity> {
    const fichaje = await this.repo.findOne({ where: { id }, relations: ['empleado'] });
    if (!fichaje) {
      throw new NotFoundException('Fichaje no encontrado');
    }

    if (input.estado !== undefined) fichaje.estado = input.estado;
    if (input.tiempo !== undefined) fichaje.tiempo = input.tiempo;
    if (input.empleadoId !== undefined) {
      fichaje.empleadoId = input.empleadoId;
      if (input.empleadoId === null) fichaje.empleado = null;
    }

    return this.repo.save(fichaje);
  }

  async reassignPin(
    pin: string,
    planta: Planta,
    empleadoId: string | null,
  ): Promise<{ updated: number }> {
    if (empleadoId) {
      const emp = await this.empleadoRepo.findOne({ where: { id: empleadoId } });
      if (!emp) throw new NotFoundException('Empleado no encontrado');
      if (emp.planta !== planta) {
        throw new BadRequestException(
          `El empleado ${emp.firstName} ${emp.lastName} pertenece a ${emp.planta}, no a ${planta}`,
        );
      }
    }
    const normalized = this.normalizePin(pin);
    const candidates = Array.from(new Set([pin, normalized, normalized.padStart(8, '0')]));
    const result = await this.repo
      .createQueryBuilder()
      .update(FichajeEntity)
      .set({ empleadoId })
      .where('pin IN (:...pins)', { pins: candidates })
      .andWhere('planta = :planta', { planta })
      .execute();
    return { updated: result.affected ?? 0 };
  }

  async reconcileUnmatched(limit = 2000): Promise<{ scanned: number; matched: number }> {
    const rows = await this.repo
      .createQueryBuilder('f')
      .where('f.empleadoId IS NULL')
      .orderBy('f.createdAt', 'DESC')
      .take(Math.max(1, Math.min(Number(limit) || 2000, 10000)))
      .getMany();

    this.logger.log(`reconcileUnmatched: ${rows.length} fichajes sin empleado`);

    const allEmpleados = await this.empleadoRepo.find();
    this.logger.log(`reconcileUnmatched: ${allEmpleados.length} empleados en DB`);

    // Índice estrictamente por (planta, pin) — nunca se cruzan plantas
    const plantaPinIndex = new Map<string, EmpleadoEntity>();
    for (const emp of allEmpleados) {
      if (!emp.planta) continue;
      const norm = this.normalizePin(emp.pin);
      for (const v of [norm, emp.pin, norm.padStart(8, '0')]) {
        plantaPinIndex.set(`${emp.planta}:${v}`, emp);
      }
    }

    this.logger.log(`reconcileUnmatched: índice construido con ${plantaPinIndex.size} entradas por planta`);

    let matched = 0;
    for (const row of rows) {
      // Sin planta en el fichaje no hay forma segura de resolver a qué empleado pertenece
      if (!row.planta) {
        this.logger.debug(`Fichaje sin planta, PIN="${row.pin}" — omitido`);
        continue;
      }
      const key = this.normalizePin(row.pin);
      const empleado =
        plantaPinIndex.get(`${row.planta}:${key}`) ??
        plantaPinIndex.get(`${row.planta}:${row.pin}`) ??
        null;
      if (!empleado) {
        this.logger.debug(`Sin match para planta="${row.planta}" PIN="${row.pin}"`);
        continue;
      }
      row.empleadoId = empleado.id;
      await this.repo.save(row);
      matched++;
    }

    this.logger.log(`reconcileUnmatched: ${matched}/${rows.length} fichajes asociados`);
    return { scanned: rows.length, matched };
  }

  private normalizePin(pin: string): string {
    const trimmed = pin.trim();
    const withoutLeadingZeros = trimmed.replace(/^0+/, '');
    return withoutLeadingZeros.length > 0 ? withoutLeadingZeros : '0';
  }

  async getPinesSummary(): Promise<PinSummaryRow[]> {
    const rows: Array<{
      pin: string;
      planta: string;
      total: number;
      ultimo: Date;
      empleado_id: string | null;
      first_name: string | null;
      last_name: string | null;
      empleado_planta: string | null;
    }> = await this.repo.query(`
      WITH ranked AS (
        SELECT
          pin,
          planta,
          empleado_id,
          COUNT(*)::int               AS total,
          MAX(tiempo)                 AS ultimo,
          ROW_NUMBER() OVER (
            PARTITION BY pin, planta
            ORDER BY COUNT(*) DESC, MAX(tiempo) DESC
          ) AS rn
        FROM asistencia_fichajes
        WHERE planta IS NOT NULL
        GROUP BY pin, planta, empleado_id
      )
      SELECT
        r.pin,
        r.planta::text,
        r.total,
        r.ultimo,
        r.empleado_id,
        e.first_name,
        e.last_name,
        e.planta::text AS empleado_planta
      FROM ranked r
      LEFT JOIN asistencia_empleados e ON r.empleado_id = e.id
      WHERE r.rn = 1
      ORDER BY r.planta, r.pin
    `);

    return rows.map((r) => ({
      pin: r.pin,
      planta: r.planta as Planta,
      totalFichajes: r.total,
      ultimoFichaje: r.ultimo ? r.ultimo.toISOString() : null,
      empleadoId: r.empleado_id ?? null,
      empleadoNombre:
        r.first_name && r.last_name ? `${r.first_name} ${r.last_name}` : null,
      empleadoPlanta: (r.empleado_planta as Planta | null) ?? null,
    }));
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
