import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ReportMailerService } from './report-mailer.service';

const AR_TZ = 'America/Argentina/Buenos_Aires';

@Injectable()
export class ReportSchedulerService {
  private readonly logger = new Logger(ReportSchedulerService.name);

  constructor(private readonly mailer: ReportMailerService) {}

  // Lunes a viernes a las 07:30 (hora Argentina)
  @Cron('30 7 * * 1-5', { timeZone: AR_TZ })
  async enviarReporteDiario(): Promise<void> {
    const ymd = this.previousBusinessDay();
    this.logger.log(`Enviando reporte de fichajes del día hábil anterior: ${ymd}`);
    try {
      await this.mailer.sendDailyReport(ymd);
    } catch (err) {
      this.logger.error(`Error al enviar reporte de fichajes: ${(err as Error).message}`, (err as Error).stack);
    }
  }

  /**
   * Devuelve el último día hábil anterior a hoy (hora Argentina).
   * Si hoy es lunes retorna el viernes anterior; si es mar-vie retorna ayer.
   */
  private previousBusinessDay(): string {
    const now = new Date(
      new Date().toLocaleString('en-US', { timeZone: AR_TZ }),
    );
    const dow = now.getDay(); // 0=Dom, 1=Lun, ..., 5=Vie, 6=Sab
    const daysBack = dow === 1 ? 3 : 1; // lunes → retrocede 3 (viernes)
    now.setDate(now.getDate() - daysBack);
    return [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('-');
  }
}
