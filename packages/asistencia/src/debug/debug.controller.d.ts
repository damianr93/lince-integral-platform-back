import { Repository } from 'typeorm';
import { RawLogEntity } from '../entities/raw-log.entity';
import { FichajeEntity } from '../entities/fichaje.entity';
import { AdmsService } from '../adms/adms.service';
import { EstadoFichaje } from '../entities/fichaje.entity';
declare class SimulatePunchDto {
    pin: string;
    status: EstadoFichaje;
    deviceSn: string;
}
export declare class DebugController {
    private readonly admsService;
    private readonly rawLogRepo;
    private readonly fichajeRepo;
    constructor(admsService: AdmsService, rawLogRepo: Repository<RawLogEntity>, fichajeRepo: Repository<FichajeEntity>);
    /**
     * GET /api/asistencia/debug/raw-logs
     * Últimos 50 registros crudos del reloj — para diagnóstico durante integración.
     */
    getRawLogs(limit?: number): Promise<RawLogEntity[]>;
    /**
     * POST /api/asistencia/debug/simulate-punch
     * Simula un fichaje sin necesitar el reloj físico conectado.
     * Body: { pin: "3", status: 0, deviceSn: "SERIAL_TUCUMAN" }
     */
    simulatePunch(dto: SimulatePunchDto): Promise<FichajeEntity>;
    /**
     * DELETE /api/asistencia/debug/raw-logs
     * Borra todos los raw logs (útil para limpiar registros de prueba).
     */
    /**
     * GET /api/asistencia/debug/fichajes
     * Últimos 50 fichajes — para ver IDs y diagnóstico.
     */
    getFichajes(limit?: number): Promise<FichajeEntity[]>;
    deleteRawLog(id: string): Promise<{
        deleted: boolean;
        affected: number | null | undefined;
    }>;
    deleteFichaje(id: string): Promise<{
        deleted: boolean;
        affected: number | null | undefined;
    }>;
}
export {};
//# sourceMappingURL=debug.controller.d.ts.map