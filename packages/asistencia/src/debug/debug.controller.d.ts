import { Repository } from 'typeorm';
import { RawLogEntity } from '../entities/raw-log.entity';
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
    constructor(admsService: AdmsService, rawLogRepo: Repository<RawLogEntity>);
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
    simulatePunch(dto: SimulatePunchDto): Promise<import("../entities/fichaje.entity").FichajeEntity>;
}
export {};
//# sourceMappingURL=debug.controller.d.ts.map