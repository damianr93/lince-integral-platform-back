import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import ExcelJS from 'exceljs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FichajeEntity, EstadoFichaje } from '../entities/fichaje.entity';
import { EmpleadoEntity } from '../entities/empleado.entity';

const AR_TZ = 'America/Argentina/Buenos_Aires';
const HORAS_JORNADA = 9;
const MS_JORNADA = HORAS_JORNADA * 3600000;

// ── Colores (igual que el frontend) ──────────────────────────────────────────
const COLOR_HEADER_BG = 'FF343A40';
const COLOR_HEADER_FG = 'FFFFFFFF';
const COLOR_GREEN_BG  = 'FFD4EDDA';
const COLOR_GREEN_FG  = 'FF155724';
const COLOR_RED_BG    = 'FFF8D7DA';
const COLOR_RED_FG    = 'FF721C24';
const COLOR_GRAY_BG   = 'FFF5F5F5';
const COLOR_GRAY_FG   = 'FF6C757D';
const COLOR_AMBER_BG  = 'FFFFF3CD';
const COLOR_AMBER_FG  = 'FF856404';

// ── Tipos internos ────────────────────────────────────────────────────────────
interface Fichaje {
  id: string;
  pin: string;
  empleadoId: string | null;
  tiempo: Date;
  estado: EstadoFichaje;
  planta: string | null;
  empleado: { firstName: string; lastName: string } | null;
}

interface Pair {
  entrada: Fichaje;
  salida:  Fichaje;
  ms:      number;
}

interface EmployeeDayAgg {
  key:             string;
  fichajes:        Fichaje[];
  pairs:           Pair[];
  orphanEntradas:  Fichaje[];
  orphanSalidas:   Fichaje[];
  totalMs:         number;
}

@Injectable()
export class ReportMailerService {
  private readonly logger = new Logger(ReportMailerService.name);

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(FichajeEntity)
    private readonly fichajeRepo: Repository<FichajeEntity>,
    @InjectRepository(EmpleadoEntity)
    private readonly empleadoRepo: Repository<EmpleadoEntity>,
  ) {}

  async sendDailyReport(ymd: string): Promise<void> {
    const to = this.config.get<string>('ASISTENCIA_REPORT_TO', '');
    if (!to) {
      this.logger.warn('ASISTENCIA_REPORT_TO no configurado — reporte no enviado');
      return;
    }
    const smtpHost = this.config.get<string>('SMTP_HOST');
    if (!smtpHost) {
      this.logger.warn('SMTP_HOST no configurado — reporte no enviado');
      return;
    }

    const fichajes = await this.fetchFichajesForDay(ymd);
    const aggs = this.buildEmployeeDayAggregates(fichajes);
    const buffer = await this.buildExcel(ymd, aggs);
    const fechaDisplay = this.formatDateDisplay(ymd);

    const smtpSecure = this.config.get<string>('SMTP_SECURE', 'false') === 'true';
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(this.config.get('SMTP_PORT', '587')),
      secure: smtpSecure,
      auth: {
        user: this.config.get<string>('SMTP_USER', ''),
        pass: this.config.get<string>('SMTP_PASS', ''),
      },
    });

    const fromName  = this.config.get<string>('MAIL_FROM_NAME', '');
    const fromEmail = this.config.get<string>('MAIL_FROM_EMAIL') || this.config.get<string>('SMTP_USER', '');
    const from =
      this.config.get<string>('ASISTENCIA_REPORT_FROM') ||
      (fromName ? `${fromName} <${fromEmail}>` : fromEmail);

    const recipients = to.split(',').map((e) => e.trim()).filter(Boolean);

    await transporter.sendMail({
      from,
      to: recipients,
      subject: `Reporte de fichajes RRHH — ${fechaDisplay}`,
      text: `Adjunto el reporte de asistencia correspondiente al ${fechaDisplay}.`,
      attachments: [{
        filename: `fichajes-${ymd}.xlsx`,
        content: buffer,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }],
    });

    this.logger.log(`Reporte de fichajes ${ymd} enviado a: ${recipients.join(', ')} (${aggs.length} empleados)`);
  }

  // ── Consulta DB ──────────────────────────────────────────────────────────────

  private async fetchFichajesForDay(ymd: string): Promise<Fichaje[]> {
    const [y, m, d] = ymd.split('-').map(Number);
    const next = new Date(Date.UTC(y, m - 1, d));
    next.setUTCDate(next.getUTCDate() + 1);
    const nextYmd = [
      next.getUTCFullYear(),
      String(next.getUTCMonth() + 1).padStart(2, '0'),
      String(next.getUTCDate()).padStart(2, '0'),
    ].join('-');

    const rows = await this.fichajeRepo
      .createQueryBuilder('f')
      .leftJoinAndSelect('f.empleado', 'e')
      .where(
        "f.tiempo >= (:dayStart::timestamp AT TIME ZONE 'America/Argentina/Buenos_Aires')" +
        " AND f.tiempo < (:dayEnd::timestamp AT TIME ZONE 'America/Argentina/Buenos_Aires')",
        { dayStart: `${ymd} 00:00:00`, dayEnd: `${nextYmd} 00:00:00` },
      )
      .orderBy('f.tiempo', 'ASC')
      .getMany();

    return rows.map((f) => ({
      id:         f.id,
      pin:        f.pin,
      empleadoId: f.empleadoId,
      tiempo:     f.tiempo,
      estado:     f.estado,
      planta:     f.planta,
      empleado:   f.empleado
        ? { firstName: f.empleado.firstName, lastName: f.empleado.lastName }
        : null,
    }));
  }

  // ── Lógica de agregación (idéntica al frontend) ───────────────────────────

  private buildEmployeeDayAggregates(items: Fichaje[]): EmployeeDayAgg[] {
    const byEmp = new Map<string, Fichaje[]>();
    for (const r of items) {
      const k = r.empleadoId ? `id:${r.empleadoId}` : `pin:${r.pin}`;
      const arr = byEmp.get(k) ?? [];
      arr.push(r);
      byEmp.set(k, arr);
    }

    const aggs: EmployeeDayAgg[] = [];

    for (const [key, evs] of byEmp) {
      const sorted = [...evs].sort((a, b) => +a.tiempo - +b.tiempo);
      const pairs:          Pair[]    = [];
      const orphanEntradas: Fichaje[] = [];
      const orphanSalidas:  Fichaje[] = [];
      const openEntradas:   Fichaje[] = [];

      for (const ev of sorted) {
        if (ev.estado === EstadoFichaje.ENTRADA) {
          openEntradas.push(ev);
        } else {
          const salidaMs = +ev.tiempo;
          while (openEntradas.length > 0 && +openEntradas[0].tiempo >= salidaMs) {
            orphanEntradas.push(openEntradas.shift()!);
          }
          const entrada = openEntradas.shift();
          if (entrada) {
            const ms = salidaMs - +entrada.tiempo;
            if (ms >= 0) {
              pairs.push({ entrada, salida: ev, ms });
            } else {
              orphanSalidas.push(ev);
              openEntradas.unshift(entrada);
            }
          } else {
            orphanSalidas.push(ev);
          }
        }
      }
      orphanEntradas.push(...openEntradas);

      const totalMs = pairs.reduce((sum, p) => sum + p.ms, 0);

      const fichajesMap = new Map<string, Fichaje>();
      for (const p of pairs) {
        fichajesMap.set(p.entrada.id, p.entrada);
        fichajesMap.set(p.salida.id,  p.salida);
      }
      for (const f of orphanEntradas) fichajesMap.set(f.id, f);
      for (const f of orphanSalidas)  fichajesMap.set(f.id, f);

      const fichajes = [...fichajesMap.values()].sort((a, b) => +a.tiempo - +b.tiempo);

      aggs.push({ key, fichajes, pairs, orphanEntradas, orphanSalidas, totalMs });
    }

    // Ordenar por último fichaje desc (igual que el frontend)
    aggs.sort((a, b) => {
      const last = (x: EmployeeDayAgg) =>
        Math.max(...x.fichajes.map((f) => +f.tiempo), 0);
      return last(b) - last(a);
    });

    return aggs;
  }

  // ── Construcción del Excel ────────────────────────────────────────────────

  private async buildExcel(ymd: string, aggs: EmployeeDayAgg[]): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Lince RRHH';
    wb.created = new Date();

    const ws = wb.addWorksheet(ymd);

    // Título
    ws.mergeCells('A1:F1');
    const titleCell = ws.getCell('A1');
    titleCell.value = `Fichajes · ${this.formatDayHeading(ymd)}`;
    titleCell.font = { bold: true, size: 13, color: { argb: 'FF212529' } };
    titleCell.alignment = { horizontal: 'left', vertical: 'middle' };
    ws.getRow(1).height = 24;

    // Fila vacía
    ws.addRow([]);

    // Encabezado
    const headerRow = ws.addRow([
      'Empleado', 'Planta', 'Tramos entrada→salida', 'Total del día', `Saldo ${HORAS_JORNADA}h`, 'Observaciones',
    ]);
    headerRow.height = 20;
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_HEADER_BG } };
      cell.font = { bold: true, color: { argb: COLOR_HEADER_FG }, size: 10 };
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
      cell.border = { bottom: { style: 'thin', color: { argb: 'FF6C757D' } } };
    });

    // Filas de datos
    if (aggs.length === 0) {
      const emptyRow = ws.addRow(['Sin fichajes para este día']);
      emptyRow.getCell(1).font = { italic: true, color: { argb: COLOR_GRAY_FG } };
    }

    for (const agg of aggs) {
      const tieneValidos = agg.pairs.length > 0;
      const saldoMs = agg.totalMs - MS_JORNADA;

      const tramos = agg.pairs
        .map((p) =>
          `${this.formatSoloHora(p.entrada.tiempo)} → ${this.formatSoloHora(p.salida.tiempo)} (${this.formatDuracion(p.ms)})`,
        )
        .join('  |  ');

      const observaciones = [
        ...agg.orphanEntradas.map((f) => `⚠ Entrada sin salida: ${this.formatSoloHora(f.tiempo)}`),
        ...agg.orphanSalidas.map((f)  => `⚠ Salida sin entrada: ${this.formatSoloHora(f.tiempo)}`),
      ].join('  |  ');

      const dataRow = ws.addRow([
        this.employeeDisplayLabel(agg),
        this.plantasLabel(agg),
        tramos || '—',
        tieneValidos ? this.formatDuracion(agg.totalMs) : '—',
        tieneValidos ? this.formatSaldoJornada(saldoMs)  : '—',
        observaciones || '',
      ]);

      let rowBgArgb: string;
      let rowFgArgb: string;
      if (!tieneValidos) {
        rowBgArgb = COLOR_GRAY_BG; rowFgArgb = COLOR_GRAY_FG;
      } else if (agg.totalMs >= MS_JORNADA) {
        rowBgArgb = COLOR_GREEN_BG; rowFgArgb = COLOR_GREEN_FG;
      } else {
        rowBgArgb = COLOR_RED_BG; rowFgArgb = COLOR_RED_FG;
      }

      dataRow.height = observaciones ? 30 : 20;
      dataRow.eachCell((cell, colNum) => {
        const isObsCol = colNum === 6;
        const bg = isObsCol && observaciones ? COLOR_AMBER_BG : rowBgArgb;
        const fg = isObsCol && observaciones ? COLOR_AMBER_FG : rowFgArgb;
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
        cell.font = { color: { argb: fg }, size: 10 };
        cell.alignment = { vertical: 'middle', wrapText: true };
        cell.border = { bottom: { style: 'hair', color: { argb: 'FFD0D0D0' } } };
      });
      dataRow.getCell(1).font = { bold: true, color: { argb: rowFgArgb }, size: 10 };
    }

    ws.columns = [
      { key: 'empleado', width: 28 },
      { key: 'planta',   width: 14 },
      { key: 'tramos',   width: 48 },
      { key: 'total',    width: 14 },
      { key: 'saldo',    width: 14 },
      { key: 'obs',      width: 38 },
    ];

    const buffer = await wb.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private employeeDisplayLabel(agg: EmployeeDayAgg): string {
    const withEmp = agg.fichajes.find((f) => f.empleado);
    if (withEmp?.empleado) {
      return `${withEmp.empleado.firstName} ${withEmp.empleado.lastName}`;
    }
    return 'Sin empleado asociado';
  }

  private plantasLabel(agg: EmployeeDayAgg): string {
    const set = new Set<string>();
    for (const f of agg.fichajes) {
      if (f.planta) set.add(f.planta);
    }
    if (set.size === 0) return '—';
    return [...set].join(', ');
  }

  private formatDayHeading(ymd: string): string {
    const [y, mo, da] = ymd.split('-').map(Number);
    const refUtc = Date.UTC(y, mo - 1, da, 12, 0, 0);
    return new Date(refUtc).toLocaleDateString('es-AR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      timeZone: AR_TZ,
    });
  }

  private formatDuracion(ms: number): string {
    if (ms < 0) return '—';
    if (ms === 0) return '0 min';
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    if (h > 0) return `${h} h ${m} min`;
    if (m > 0) return `${m} min`;
    return '< 1 min';
  }

  private formatSaldoJornada(ms: number): string {
    const abs = Math.abs(ms);
    if (abs < 60000) return '0 min';
    return `${ms > 0 ? '+' : '-'} ${this.formatDuracion(abs)}`;
  }

  private formatSoloHora(date: Date): string {
    return new Intl.DateTimeFormat('es-AR', {
      timeZone: AR_TZ, hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
    }).format(date);
  }

  private formatDateDisplay(ymd: string): string {
    const [y, m, d] = ymd.split('-');
    return `${d}/${m}/${y}`;
  }
}
