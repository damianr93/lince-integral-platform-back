import {
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AdmsService } from './adms.service';

/**
 * AdmsController — Integración ZKTeco via protocolo ADMS (HTTP push)
 *
 * Los relojes ZKTeco envían fichajes a:
 *   GET  /iclock/cdata   → handshake inicial, el reloj pide configuración
 *   POST /iclock/cdata   → envío de fichajes (ATTLOG lines)
 *   GET  /iclock/getrequest  → heartbeat periódico
 *   POST /iclock/devicecmd   → confirmación de comandos enviados al reloj
 *
 * IMPORTANTE: estos endpoints NO llevan el prefijo /api (excluido en main.ts).
 * Todos responden Content-Type: text/plain — el reloj no entiende JSON.
 */
@Controller('iclock')
export class AdmsController {
  private readonly logger = new Logger(AdmsController.name);

  constructor(private readonly adms: AdmsService) {}

  // ── GET /iclock/cdata — Handshake ──────────────────────────────────────────

  @Get('cdata')
  async handshake(
    @Query() query: Record<string, string>,
    @Req()   req:   Request,
    @Res()   res:   Response,
  ): Promise<void> {
    await this.logRequest(req, query, null);

    const sn = query['SN'] ?? query['sn'];
    this.logger.log(`[HANDSHAKE] SN=${sn}`);

    const body = this.adms.buildHandshakeResponse(sn);
    res.setHeader('Content-Type', 'text/plain');
    res.send(body);
  }

  // ── POST /iclock/cdata — Fichajes ──────────────────────────────────────────

  @Post('cdata')
  async receivePunches(
    @Query() query: Record<string, string>,
    @Req()   req:   Request,
    @Res()   res:   Response,
  ): Promise<void> {
    const rawBody = this.getRawBody(req);
    await this.logRequest(req, query, rawBody);

    const sn = query['SN'] ?? query['sn'];
    this.logger.log(`[PUNCHES] SN=${sn} | ${rawBody?.length ?? 0} bytes`);

    if (rawBody) {
      try {
        const saved = await this.adms.processPunchPayload(rawBody, sn);
        this.logger.log(`[PUNCHES] Guardados: ${saved} fichajes`);
      } catch (err) {
        this.logger.error(`[PUNCHES] Error al procesar payload: ${(err as Error).message}`);
      }
    }

    res.setHeader('Content-Type', 'text/plain');
    res.send('OK');
  }

  // ── GET /iclock/getrequest — Heartbeat ────────────────────────────────────

  @Get('getrequest')
  async heartbeat(
    @Query() query: Record<string, string>,
    @Req()   req:   Request,
    @Res()   res:   Response,
  ): Promise<void> {
    await this.logRequest(req, query, null);
    const sn = query['SN'] ?? query['sn'];
    this.logger.debug(`[HEARTBEAT] SN=${sn}`);
    res.setHeader('Content-Type', 'text/plain');
    res.send('OK');
  }

  // ── POST /iclock/devicecmd — Confirmación de comandos ─────────────────────

  @Post('devicecmd')
  async deviceCmd(
    @Query() query: Record<string, string>,
    @Req()   req:   Request,
    @Res()   res:   Response,
  ): Promise<void> {
    const rawBody = this.getRawBody(req);
    await this.logRequest(req, query, rawBody);
    const sn = query['SN'] ?? query['sn'];
    this.logger.debug(`[DEVICECMD] SN=${sn}`);
    res.setHeader('Content-Type', 'text/plain');
    res.send('OK');
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private getRawBody(req: Request): string | null {
    const raw = (req as any).rawBody;
    if (!raw) return null;
    if (Buffer.isBuffer(raw)) return raw.toString('utf-8');
    if (typeof raw === 'string') return raw;
    return null;
  }

  private async logRequest(
    req:   Request,
    query: Record<string, string>,
    body:  string | null,
  ): Promise<void> {
    const ip = req.ip ?? req.socket?.remoteAddress ?? null;
    const headers: Record<string, string> = Object.fromEntries(
      Object.entries(req.headers).map(([k, v]) => [k, Array.isArray(v) ? v.join(', ') : (v ?? '')]),
    );

    try {
      await this.adms.saveRawLog({
        method:      req.method,
        path:        req.path,
        headers,
        queryParams: query,
        bodyRaw:     body,
        ip,
      });
    } catch (err) {
      this.logger.warn(`No se pudo guardar raw log: ${(err as Error).message}`);
    }
  }
}
