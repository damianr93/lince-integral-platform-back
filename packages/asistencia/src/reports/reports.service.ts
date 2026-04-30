import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EstadoFichaje, FichajeEntity } from '../entities/fichaje.entity';
import { EmpleadoEntity, Planta } from '../entities/empleado.entity';
import { LogsService } from '../logs/logs.service';

const AR_TZ = 'America/Argentina/Buenos_Aires';

export interface ResumenDiario {
  fecha:    string;
  planta:   Planta | 'todas';
  entradas: number;
  salidas:  number;
  presentes: number;
  ausentes:  number;
  detalle:  {
    empleadoId:  string | null;
    pin:         string;
    nombre:      string;
    entrada:     Date | null;
    salida:      Date | null;
    completo:    boolean;
  }[];
}

export interface EmpleadoPresente {
  empleadoId:  string | null;
  pin:         string;
  nombre:      string;
  planta:      Planta | null;
  ultimaEntrada: Date;
}

export interface ReportFichaje {
  id: string;
  tiempo: string;
  estado: EstadoFichaje;
}

export interface ReportPair {
  entrada: ReportFichaje;
  salida: ReportFichaje;
  ms: number;
}

export interface EmployeeReportDay {
  fecha: string;
  diaHabil: boolean;
  esperadoMs: number;
  trabajadoMs: number;
  saldoMs: number;
  fichajes: ReportFichaje[];
  tramos: ReportPair[];
  entradasSinSalida: ReportFichaje[];
  salidasSinEntrada: ReportFichaje[];
}

export interface EmployeeRangeReport {
  empleado: {
    id: string;
    pin: string;
    firstName: string;
    lastName: string;
    planta: Planta;
  };
  desde: string;
  hasta: string;
  horasEsperadasPorDia: number;
  resumen: {
    diasHabiles: number;
    diasConTramos: number;
    esperadoMs: number;
    trabajadoMs: number;
    saldoMs: number;
  };
  dias: EmployeeReportDay[];
}

@Injectable()
export class ReportsService {
  constructor(
    private readonly logsService: LogsService,
    @InjectRepository(EmpleadoEntity)
    private readonly empleadoRepo: Repository<EmpleadoEntity>,
    @InjectRepository(FichajeEntity)
    private readonly fichajeRepo: Repository<FichajeEntity>,
  ) {}

  // ── Quién está en planta ahora ─────────────────────────────────────────────

  async getPresentNow(planta?: Planta): Promise<EmpleadoPresente[]> {
    const lastPunches = await this.logsService.getLastPunchesPerPin(planta);
    return lastPunches
      .filter((f) => f.estado === EstadoFichaje.ENTRADA)
      .map((f) => ({
        empleadoId:   f.empleadoId,
        pin:          f.pin,
        nombre:       f.empleado ? `${f.empleado.firstName} ${f.empleado.lastName}` : `PIN ${f.pin}`,
        planta:       f.planta,
        ultimaEntrada: f.tiempo,
      }));
  }

  // ── Resumen del día ────────────────────────────────────────────────────────

  async getDailySummary(planta?: Planta): Promise<ResumenDiario> {
    const hoy = new Date();
    const fichajes = await this.logsService.findToday(planta);
    const empleados = await this.empleadoRepo.find({
      where: { activo: true, ...(planta ? { planta } : {}) },
    });

    // Agrupar fichajes por PIN
    const byPin = new Map<string, { entradas: FichajeEntity[]; salidas: FichajeEntity[] }>();
    for (const f of fichajes) {
      if (!byPin.has(f.pin)) byPin.set(f.pin, { entradas: [], salidas: [] });
      if (f.estado === EstadoFichaje.ENTRADA) byPin.get(f.pin)!.entradas.push(f);
      else                                    byPin.get(f.pin)!.salidas.push(f);
    }

    const detalle = empleados.map((emp) => {
      const fichs = byPin.get(emp.pin);
      const primeraEntrada = fichs?.entradas.sort((a, b) => +a.tiempo - +b.tiempo)[0]?.tiempo ?? null;
      const ultimaSalida   = fichs?.salidas.sort((a, b) => +b.tiempo - +a.tiempo)[0]?.tiempo ?? null;
      return {
        empleadoId: emp.id,
        pin:        emp.pin,
        nombre:     `${emp.firstName} ${emp.lastName}`,
        entrada:    primeraEntrada,
        salida:     ultimaSalida,
        completo:   !!primeraEntrada && !!ultimaSalida,
      };
    });

    const presentes = detalle.filter((d) => d.entrada && !d.salida).length;

    return {
      fecha:    hoy.toISOString().slice(0, 10),
      planta:   planta ?? 'todas',
      entradas: fichajes.filter((f) => f.estado === EstadoFichaje.ENTRADA).length,
      salidas:  fichajes.filter((f) => f.estado === EstadoFichaje.SALIDA).length,
      presentes,
      ausentes: empleados.length - detalle.filter((d) => d.entrada).length,
      detalle,
    };
  }

  // ── Historial de empleado ──────────────────────────────────────────────────

  async getEmployeeHistory(
    empleadoId: string,
    limit = 100,
  ): Promise<FichajeEntity[]> {
    return this.logsService.findByEmployee(empleadoId, limit);
  }

  // ── Reporte por empleado y rango ──────────────────────────────────────────

  async getEmployeeRangeReport(params: {
    empleadoId: string;
    desde?: string;
    hasta?: string;
    horasEsperadasPorDia?: string;
  }): Promise<EmployeeRangeReport> {
    const desde = params.desde?.trim();
    const hasta = params.hasta?.trim();
    if (!desde || !hasta || !/^\d{4}-\d{2}-\d{2}$/.test(desde) || !/^\d{4}-\d{2}-\d{2}$/.test(hasta)) {
      throw new BadRequestException('desde y hasta deben ser YYYY-MM-DD');
    }
    if (desde > hasta) {
      throw new BadRequestException('desde no puede ser mayor que hasta');
    }

    const horasEsperadasPorDia = Math.max(0, Number(params.horasEsperadasPorDia ?? 8) || 0);
    const empleado = await this.empleadoRepo.findOne({ where: { id: params.empleadoId } });
    if (!empleado) {
      throw new NotFoundException('Empleado no encontrado');
    }

    const hastaExclusivo = this.nextCalendarDayYmd(hasta);
    const fichajes = await this.fichajeRepo
      .createQueryBuilder('f')
      .where('f.empleadoId = :empleadoId', { empleadoId: empleado.id })
      .andWhere(
        "f.tiempo >= (:desde::timestamp AT TIME ZONE 'America/Argentina/Buenos_Aires')" +
          " AND f.tiempo < (:hasta::timestamp AT TIME ZONE 'America/Argentina/Buenos_Aires')",
        {
          desde: `${desde} 00:00:00`,
          hasta: `${hastaExclusivo} 00:00:00`,
        },
      )
      .orderBy('f.tiempo', 'ASC')
      .getMany();

    const byDay = new Map<string, FichajeEntity[]>();
    for (const fichaje of fichajes) {
      const day = this.argentinaYmd(fichaje.tiempo);
      const arr = byDay.get(day) ?? [];
      arr.push(fichaje);
      byDay.set(day, arr);
    }

    const dias = this.ymdRange(desde, hasta).map((fecha) => {
      const dayFichajes = byDay.get(fecha) ?? [];
      const diaHabil = this.isBusinessDay(fecha);
      const esperadoMs = diaHabil ? horasEsperadasPorDia * 60 * 60 * 1000 : 0;
      const { tramos, entradasSinSalida, salidasSinEntrada } = this.buildPairs(dayFichajes);
      const trabajadoMs = tramos.reduce((sum, tramo) => sum + tramo.ms, 0);

      return {
        fecha,
        diaHabil,
        esperadoMs,
        trabajadoMs,
        saldoMs: trabajadoMs - esperadoMs,
        fichajes: dayFichajes.map((f) => this.serializeReportFichaje(f)),
        tramos,
        entradasSinSalida,
        salidasSinEntrada,
      };
    });

    const esperadoMs = dias.reduce((sum, dia) => sum + dia.esperadoMs, 0);
    const trabajadoMs = dias.reduce((sum, dia) => sum + dia.trabajadoMs, 0);

    return {
      empleado: {
        id: empleado.id,
        pin: empleado.pin,
        firstName: empleado.firstName,
        lastName: empleado.lastName,
        planta: empleado.planta,
      },
      desde,
      hasta,
      horasEsperadasPorDia,
      resumen: {
        diasHabiles: dias.filter((dia) => dia.diaHabil).length,
        diasConTramos: dias.filter((dia) => dia.tramos.length > 0).length,
        esperadoMs,
        trabajadoMs,
        saldoMs: trabajadoMs - esperadoMs,
      },
      dias,
    };
  }

  // ── Fichajes con filtros (para tabla general) ──────────────────────────────

  async getAttendance(params: {
    planta?:     Planta;
    empleadoId?: string;
    desde?:      string;
    hasta?:      string;
    estado?:     string;
    page?:       string;
    limit?:      string;
  }) {
    return this.logsService.findAll({
      planta:     params.planta,
      empleadoId: params.empleadoId,
      desde:      params.desde ? new Date(params.desde) : undefined,
      hasta:      params.hasta ? new Date(params.hasta) : undefined,
      estado:     params.estado !== undefined ? Number(params.estado) as EstadoFichaje : undefined,
      page:       params.page ? Number(params.page) : undefined,
      limit:      params.limit ? Number(params.limit) : undefined,
    });
  }

  private buildPairs(fichajes: FichajeEntity[]): {
    tramos: ReportPair[];
    entradasSinSalida: ReportFichaje[];
    salidasSinEntrada: ReportFichaje[];
  } {
    const sorted = [...fichajes].sort((a, b) => +a.tiempo - +b.tiempo);
    const tramos: ReportPair[] = [];
    const entradasSinSalida: ReportFichaje[] = [];
    const salidasSinEntrada: ReportFichaje[] = [];
    const abiertas: FichajeEntity[] = [];

    for (const fichaje of sorted) {
      if (fichaje.estado === EstadoFichaje.ENTRADA) {
        abiertas.push(fichaje);
        continue;
      }

      const salidaMs = fichaje.tiempo.getTime();
      while (abiertas.length > 0 && abiertas[0].tiempo.getTime() >= salidaMs) {
        entradasSinSalida.push(this.serializeReportFichaje(abiertas.shift()!));
      }

      const entrada = abiertas.shift();
      if (entrada) {
        tramos.push({
          entrada: this.serializeReportFichaje(entrada),
          salida: this.serializeReportFichaje(fichaje),
          ms: salidaMs - entrada.tiempo.getTime(),
        });
      } else {
        salidasSinEntrada.push(this.serializeReportFichaje(fichaje));
      }
    }

    entradasSinSalida.push(...abiertas.map((f) => this.serializeReportFichaje(f)));
    return { tramos, entradasSinSalida, salidasSinEntrada };
  }

  private serializeReportFichaje(fichaje: FichajeEntity): ReportFichaje {
    return {
      id: fichaje.id,
      tiempo: this.toArgentinaIso(fichaje.tiempo),
      estado: fichaje.estado,
    };
  }

  private toArgentinaIso(value: Date): string {
    const parts = this.argentinaDateParts(value);
    const ymd = [
      this.datePart(parts, 'year'),
      this.datePart(parts, 'month'),
      this.datePart(parts, 'day'),
    ].join('-');
    const hms = [
      this.datePart(parts, 'hour'),
      this.datePart(parts, 'minute'),
      this.datePart(parts, 'second'),
    ].join(':');
    return `${ymd}T${hms}-03:00`;
  }

  private argentinaYmd(value: Date): string {
    const parts = this.argentinaDateParts(value);
    return [
      this.datePart(parts, 'year'),
      this.datePart(parts, 'month'),
      this.datePart(parts, 'day'),
    ].join('-');
  }

  private argentinaDateParts(value: Date): Intl.DateTimeFormatPart[] {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: AR_TZ,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(value);
  }

  private datePart(
    parts: Intl.DateTimeFormatPart[],
    type: Intl.DateTimeFormatPartTypes,
  ): string {
    return parts.find((part) => part.type === type)?.value ?? '00';
  }

  private nextCalendarDayYmd(ymd: string): string {
    const [y, m, d] = ymd.split('-').map((s) => parseInt(s, 10));
    const dt = new Date(Date.UTC(y, m - 1, d));
    dt.setUTCDate(dt.getUTCDate() + 1);
    return [
      dt.getUTCFullYear(),
      String(dt.getUTCMonth() + 1).padStart(2, '0'),
      String(dt.getUTCDate()).padStart(2, '0'),
    ].join('-');
  }

  private ymdRange(desde: string, hasta: string): string[] {
    const days: string[] = [];
    let cur = desde;
    while (cur <= hasta) {
      days.push(cur);
      cur = this.nextCalendarDayYmd(cur);
    }
    return days;
  }

  private isBusinessDay(ymd: string): boolean {
    const [y, m, d] = ymd.split('-').map((s) => parseInt(s, 10));
    const dow = new Date(Date.UTC(y, m - 1, d, 12, 0, 0)).getUTCDay();
    return dow >= 1 && dow <= 5;
  }
}
