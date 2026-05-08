import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import ExcelJS from 'exceljs';
import { ReportsService, ResumenDiarioExtendido } from './reports.service';
import { Planta } from '../entities/empleado.entity';

const AR_TZ = 'America/Argentina/Buenos_Aires';

@Injectable()
export class ReportMailerService {
  private readonly logger = new Logger(ReportMailerService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly reports: ReportsService,
  ) {}

  async sendDailyReport(ymd: string): Promise<void> {
    const to = this.config.get<string>('ASISTENCIA_REPORT_TO', '');
    if (!to) {
      this.logger.warn('ASISTENCIA_REPORT_TO no configurado — reporte no enviado');
      return;
    }

    const [tucuman, villaNueva] = await Promise.all([
      this.reports.getDailySummaryForDate(ymd, Planta.TUCUMAN),
      this.reports.getDailySummaryForDate(ymd, Planta.VILLA_NUEVA),
    ]);

    const buffer = await this.buildExcel(ymd, tucuman, villaNueva);
    const fechaDisplay = this.formatDateDisplay(ymd);

    const smtpHost = this.config.get<string>('SMTP_HOST');
    if (!smtpHost) {
      this.logger.warn('SMTP_HOST no configurado — reporte no enviado');
      return;
    }

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
      attachments: [
        {
          filename: `fichajes-${ymd}.xlsx`,
          content: buffer,
          contentType:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      ],
    });

    this.logger.log(`Reporte de fichajes ${ymd} enviado a: ${recipients.join(', ')}`);
  }

  private async buildExcel(
    ymd: string,
    tucuman: ResumenDiarioExtendido,
    villaNueva: ResumenDiarioExtendido,
  ): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Lince Gestión Integral';
    wb.created = new Date();

    const plantas: Array<{ resumen: ResumenDiarioExtendido; label: string }> = [
      { resumen: tucuman,    label: 'Tucumán' },
      { resumen: villaNueva, label: 'Villa Nueva' },
    ];

    for (const { resumen, label } of plantas) {
      const ws = wb.addWorksheet(label);

      // ── Título ──────────────────────────────────────────────────────────────
      ws.mergeCells('A1:H1');
      const titleCell = ws.getCell('A1');
      titleCell.value = `Reporte de Fichajes — ${label} — ${this.formatDateDisplay(ymd)}`;
      titleCell.font = { bold: true, size: 13, color: { argb: 'FF1F4E79' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      ws.getRow(1).height = 24;

      // ── Resumen ──────────────────────────────────────────────────────────────
      ws.getCell('A2').value = `Presentes: ${resumen.presentes}`;
      ws.getCell('C2').value = `Ausentes: ${resumen.ausentes}`;
      ws.getCell('E2').value = `Total activos: ${resumen.detalle.length}`;
      ws.getRow(2).font = { italic: true, size: 10 };
      ws.getRow(2).height = 16;

      // ── Encabezado de columnas ───────────────────────────────────────────────
      const COLS = [
        'Apellido y Nombre',
        'PIN',
        'DNI',
        'Departamento',
        'Cargo',
        'Primera Entrada',
        'Última Salida',
        'Estado',
      ];
      const headerRow = ws.addRow(COLS);
      headerRow.height = 18;
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF1F4E79' },
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = { bottom: { style: 'thin', color: { argb: 'FFAAAAAA' } } };
      });

      // ── Filas de datos ───────────────────────────────────────────────────────
      const sorted = [...resumen.detalle].sort((a, b) =>
        a.nombre.localeCompare(b.nombre, 'es'),
      );

      for (const d of sorted) {
        const estado = !d.entrada
          ? 'Ausente'
          : !d.salida
          ? 'Sin salida'
          : 'Completo';

        const fgColor = !d.entrada
          ? 'FFFCE4D6' // rojo suave — ausente
          : !d.salida
          ? 'FFFFFF99' // amarillo — falta salida
          : 'FFEBF3EB'; // verde suave — completo

        const dataRow = ws.addRow([
          d.nombre,
          d.pin,
          d.dni ?? '',
          d.departamento ?? '',
          d.cargo ?? '',
          d.entrada ? this.formatTime(d.entrada) : '',
          d.salida  ? this.formatTime(d.salida)  : '',
          estado,
        ]);

        dataRow.height = 15;
        dataRow.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fgColor } };
          cell.font = { size: 10 };
          cell.alignment = { vertical: 'middle' };
          cell.border = {
            bottom: { style: 'hair', color: { argb: 'FFDDDDDD' } },
          };
        });

        // Centrar columnas numéricas y de estado
        [1, 2, 3, 5, 6, 7].forEach((col) => {
          dataRow.getCell(col + 1).alignment = { horizontal: 'center', vertical: 'middle' };
        });
      }

      // ── Anchos de columna ───────────────────────────────────────────────────
      ws.columns = [
        { width: 30 }, // Nombre
        { width: 8  }, // PIN
        { width: 12 }, // DNI
        { width: 20 }, // Departamento
        { width: 18 }, // Cargo
        { width: 18 }, // Entrada
        { width: 18 }, // Salida
        { width: 14 }, // Estado
      ];
    }

    const buffer = await wb.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private formatDateDisplay(ymd: string): string {
    const [y, m, d] = ymd.split('-');
    return `${d}/${m}/${y}`;
  }

  private formatTime(date: Date): string {
    return new Intl.DateTimeFormat('es-AR', {
      timeZone: AR_TZ,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date);
  }
}
