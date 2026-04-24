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
export declare class AdmsController {
    private readonly adms;
    private readonly logger;
    constructor(adms: AdmsService);
    handshake(query: Record<string, string>, req: Request, res: Response): Promise<void>;
    receivePunches(query: Record<string, string>, req: Request, res: Response): Promise<void>;
    heartbeat(query: Record<string, string>, req: Request, res: Response): Promise<void>;
    deviceCmd(query: Record<string, string>, req: Request, res: Response): Promise<void>;
    private getRawBody;
    private logRequest;
}
//# sourceMappingURL=adms.controller.d.ts.map