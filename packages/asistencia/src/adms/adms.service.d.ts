import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { RawLogEntity } from '../entities/raw-log.entity';
import { FichajeEntity, EstadoFichaje } from '../entities/fichaje.entity';
import { EmpleadoEntity } from '../entities/empleado.entity';
export declare class AdmsService {
    private readonly config;
    private readonly rawLogRepo;
    private readonly fichajeRepo;
    private readonly empleadoRepo;
    private readonly logger;
    /** Mapeo SN de dispositivo → planta (se configura por variables de entorno) */
    private readonly devicePlantMap;
    constructor(config: ConfigService, rawLogRepo: Repository<RawLogEntity>, fichajeRepo: Repository<FichajeEntity>, empleadoRepo: Repository<EmpleadoEntity>);
    saveRawLog(data: {
        method: string;
        path: string;
        headers: Record<string, string>;
        queryParams: Record<string, string>;
        bodyRaw: string | null;
        ip: string | null;
    }): Promise<void>;
    buildHandshakeResponse(sn: string | undefined): string;
    processPunchPayload(body: string, sn: string | undefined): Promise<number>;
    simulatePunch(pin: string, status: EstadoFichaje, deviceSn: string): Promise<FichajeEntity>;
    /**
     * Parsea las líneas de fichaje del protocolo ADMS.
     * Formato esperado (cada línea es un fichaje):
     *   ATTLOG\t<PIN>\t<YYYY-MM-DD HH:mm:ss>\t<Status>\t<Verify>\t...
     * También soporta formato sin prefijo ATTLOG, solo campos separados por tab o espacio.
     */
    private parsePunchLines;
    private parseSingleLine;
    /**
     * Intenta parsear el body ADMS como objeto clave=valor para el raw log.
     * Soporta tanto líneas separadas (\n) como tabs (\t).
     */
    private parseAdmsBody;
    private isDuplicate;
}
//# sourceMappingURL=adms.service.d.ts.map