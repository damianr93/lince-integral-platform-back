import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RawLogEntity } from '../entities/raw-log.entity';
import { FichajeEntity, EstadoFichaje } from '../entities/fichaje.entity';
import { EmpleadoEntity, Planta } from '../entities/empleado.entity';

interface ParsedPunch {
  pin:    string;
  time:   Date;
  status: EstadoFichaje;
  verify: number | null;
}

@Injectable()
export class AdmsService {
  private readonly logger = new Logger(AdmsService.name);

  /** Mapeo SN de dispositivo → planta (se configura por variables de entorno) */
  private readonly devicePlantMap: Record<string, Planta>;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(RawLogEntity)
    private readonly rawLogRepo: Repository<RawLogEntity>,
    @InjectRepository(FichajeEntity)
    private readonly fichajeRepo: Repository<FichajeEntity>,
    @InjectRepository(EmpleadoEntity)
    private readonly empleadoRepo: Repository<EmpleadoEntity>,
  ) {
    const snTucuman    = this.config.get<string>('DEVICE_SN_TUCUMAN')    ?? '';
    const snVillaNueva = this.config.get<string>('DEVICE_SN_VILLA_NUEVA') ?? '';

    this.devicePlantMap = {};
    if (snTucuman)    this.devicePlantMap[snTucuman]    = Planta.TUCUMAN;
    if (snVillaNueva) this.devicePlantMap[snVillaNueva] = Planta.VILLA_NUEVA;

    this.logger.log(`Device→Planta map: ${JSON.stringify(this.devicePlantMap)}`);
  }

  // ── Raw logging ────────────────────────────────────────────────────────────

  async saveRawLog(data: {
    method:      string;
    path:        string;
    headers:     Record<string, string>;
    queryParams: Record<string, string>;
    bodyRaw:     string | null;
    ip:          string | null;
  }): Promise<void> {
    const deviceSn = data.queryParams['SN'] ?? data.queryParams['sn'] ?? null;

    let bodyParsed: Record<string, unknown> | null = null;
    if (data.bodyRaw) {
      try {
        bodyParsed = JSON.parse(data.bodyRaw);
      } catch {
        bodyParsed = this.parseAdmsBody(data.bodyRaw);
      }
    }

    await this.rawLogRepo.save(
      this.rawLogRepo.create({
        method:      data.method,
        path:        data.path,
        headers:     data.headers,
        queryParams: data.queryParams,
        bodyRaw:     data.bodyRaw,
        bodyParsed,
        deviceSn,
        ip:          data.ip,
      }),
    );
  }

  // ── ADMS handshake ─────────────────────────────────────────────────────────

  buildHandshakeResponse(sn: string | undefined): string {
    const plant = sn ? this.devicePlantMap[sn] : undefined;
    this.logger.log(`Handshake recibido — SN: ${sn ?? 'desconocido'}, planta: ${plant ?? 'no mapeada'}`);
    return [
      'OK',
      'Realtime=1',
      'Stamp=9999',
      'OpStamp=9999',
      'ErrorDelay=30',
      'Delay=10',
      'TransTimes=00:00;14:05',
      'TransInterval=1',
      'TimeZone=0',
      'ServerVer=2.4.1 2015-01-13',
      'PushProtVer=2.4.1',
    ].join('\n');
  }

  // ── Procesamiento de fichajes ──────────────────────────────────────────────

  async processPunchPayload(body: string, sn: string | undefined): Promise<number> {
    const planta = sn ? (this.devicePlantMap[sn] ?? null) : null;
    const punches = this.parsePunchLines(body);

    if (punches.length === 0) {
      this.logger.debug(`Sin fichajes en payload — SN: ${sn}`);
      return 0;
    }

    this.logger.log(`Procesando ${punches.length} fichaje(s) — SN: ${sn}, planta: ${planta}`);

    let saved = 0;
    for (const punch of punches) {
      const isDuplicate = await this.isDuplicate(punch.pin, punch.time);
      if (isDuplicate) {
        this.logger.debug(`Duplicado ignorado — PIN: ${punch.pin}, tiempo: ${punch.time.toISOString()}`);
        continue;
      }

      const empleado = await this.empleadoRepo.findOne({ where: { pin: punch.pin } });

      await this.fichajeRepo.save(
        this.fichajeRepo.create({
          pin:        punch.pin,
          tiempo:     punch.time,
          estado:     punch.status,
          verify:     punch.verify,
          deviceSn:   sn ?? null,
          planta,
          empleadoId: empleado?.id ?? null,
          rawPayload: body,
        }),
      );
      saved++;
    }

    this.logger.log(`Guardados ${saved}/${punches.length} fichajes (${punches.length - saved} duplicados)`);
    return saved;
  }

  async simulatePunch(pin: string, status: EstadoFichaje, deviceSn: string): Promise<FichajeEntity> {
    const planta = this.devicePlantMap[deviceSn] ?? null;
    const empleado = await this.empleadoRepo.findOne({ where: { pin } });
    const tiempo = new Date();

    return this.fichajeRepo.save(
      this.fichajeRepo.create({
        pin,
        tiempo,
        estado: status,
        verify: null,
        deviceSn,
        planta,
        empleadoId: empleado?.id ?? null,
        rawPayload: `SIMULATE PIN=${pin} Status=${status} DevSn=${deviceSn}`,
      }),
    );
  }

  // ── Parsers internos ───────────────────────────────────────────────────────

  /**
   * Parsea las líneas de fichaje del protocolo ADMS.
   * Formato esperado (cada línea es un fichaje):
   *   ATTLOG\t<PIN>\t<YYYY-MM-DD HH:mm:ss>\t<Status>\t<Verify>\t...
   * También soporta formato sin prefijo ATTLOG, solo campos separados por tab o espacio.
   */
  private parsePunchLines(body: string): ParsedPunch[] {
    const punches: ParsedPunch[] = [];
    const lines = body.split(/\r?\n/).filter((l) => l.trim().length > 0);

    for (const line of lines) {
      try {
        const punch = this.parseSingleLine(line);
        if (punch) punches.push(punch);
      } catch (err) {
        this.logger.warn(`No se pudo parsear línea: "${line}" — ${(err as Error).message}`);
      }
    }

    return punches;
  }

  private parseSingleLine(line: string): ParsedPunch | null {
    const trimmed = line.trim();

    // Ignorar cabeceras del protocolo
    if (
      trimmed.startsWith('ATTLOG') && !trimmed.includes('\t') ||
      trimmed === 'ATTLOG' ||
      trimmed.startsWith('OPLOG') ||
      trimmed.startsWith('ERRORLOG') ||
      trimmed.startsWith('Table=') ||
      trimmed.startsWith('SN=') ||
      trimmed.startsWith('USER') ||
      trimmed.startsWith('FP') ||
      trimmed === 'OK'
    ) {
      return null;
    }

    // Formato: "ATTLOG\tPIN\tYYYY-MM-DD HH:mm:ss\tStatus\tVerify\t..."
    const withPrefix = /^ATTLOG\s+(.+)$/i.exec(trimmed);
    const dataLine = withPrefix ? withPrefix[1] : trimmed;

    // Separar por tab o múltiples espacios
    const parts = dataLine.split(/\t| {2,}/).map((p) => p.trim()).filter(Boolean);

    if (parts.length < 3) return null;

    const pin    = parts[0];
    const timeStr = parts[1];
    const status  = parseInt(parts[2] ?? '0', 10) as EstadoFichaje;
    const verify  = parts[3] ? parseInt(parts[3], 10) : null;

    const time = new Date(timeStr);
    if (isNaN(time.getTime())) {
      this.logger.warn(`Fecha inválida: "${timeStr}"`);
      return null;
    }

    return { pin, time, status, verify };
  }

  /**
   * Intenta parsear el body ADMS como objeto clave=valor para el raw log.
   * Soporta tanto líneas separadas (\n) como tabs (\t).
   */
  private parseAdmsBody(raw: string): Record<string, unknown> {
    const result: Record<string, unknown> = { _raw: raw };
    const lines = raw.split(/\r?\n/).filter(Boolean);

    result['_lines'] = lines.length;

    const kvPairs: Record<string, string> = {};
    for (const line of lines) {
      const parts = line.split('\t');
      if (parts.length > 1) {
        kvPairs[`line_${lines.indexOf(line)}`] = line;
      } else if (line.includes('=')) {
        const [key, ...rest] = line.split('=');
        if (key) kvPairs[key.trim()] = rest.join('=').trim();
      }
    }

    return { ...result, ...kvPairs };
  }

  private async isDuplicate(pin: string, time: Date): Promise<boolean> {
    const windowStart = new Date(time.getTime() - 30 * 1000);
    const windowEnd   = new Date(time.getTime() + 30 * 1000);

    const count = await this.fichajeRepo
      .createQueryBuilder('f')
      .where('f.pin = :pin', { pin })
      .andWhere('f.tiempo BETWEEN :start AND :end', { start: windowStart, end: windowEnd })
      .getCount();

    return count > 0;
  }
}
