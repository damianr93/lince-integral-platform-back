import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FichajeEntity, EstadoFichaje } from '../entities/fichaje.entity';
import { EmpleadoEntity, Planta } from '../entities/empleado.entity';
import { LogsService } from '../logs/logs.service';

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

  // ── Fichajes con filtros (para tabla general) ──────────────────────────────

  async getAttendance(params: {
    planta?:     Planta;
    empleadoId?: string;
    desde?:      string;
    hasta?:      string;
    estado?:     string;
    page?:       number;
    limit?:      number;
  }) {
    return this.logsService.findAll({
      planta:     params.planta,
      empleadoId: params.empleadoId,
      desde:      params.desde ? new Date(params.desde) : undefined,
      hasta:      params.hasta ? new Date(params.hasta) : undefined,
      estado:     params.estado !== undefined ? Number(params.estado) as EstadoFichaje : undefined,
      page:       params.page,
      limit:      params.limit,
    });
  }
}
