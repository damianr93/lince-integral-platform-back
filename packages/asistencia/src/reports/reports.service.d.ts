import { Repository } from 'typeorm';
import { FichajeEntity } from '../entities/fichaje.entity';
import { EmpleadoEntity, Planta } from '../entities/empleado.entity';
import { LogsService } from '../logs/logs.service';
export interface ResumenDiario {
    fecha: string;
    planta: Planta | 'todas';
    entradas: number;
    salidas: number;
    presentes: number;
    ausentes: number;
    detalle: {
        empleadoId: string | null;
        pin: string;
        nombre: string;
        entrada: Date | null;
        salida: Date | null;
        completo: boolean;
    }[];
}
export interface EmpleadoPresente {
    empleadoId: string | null;
    pin: string;
    nombre: string;
    planta: Planta | null;
    ultimaEntrada: Date;
}
export declare class ReportsService {
    private readonly logsService;
    private readonly empleadoRepo;
    constructor(logsService: LogsService, empleadoRepo: Repository<EmpleadoEntity>);
    getPresentNow(planta?: Planta): Promise<EmpleadoPresente[]>;
    getDailySummary(planta?: Planta): Promise<ResumenDiario>;
    getEmployeeHistory(empleadoId: string, limit?: number): Promise<FichajeEntity[]>;
    getAttendance(params: {
        planta?: Planta;
        empleadoId?: string;
        desde?: string;
        hasta?: string;
        estado?: string;
        page?: string;
        limit?: string;
    }): Promise<{
        items: FichajeEntity[];
        total: number;
    }>;
}
//# sourceMappingURL=reports.service.d.ts.map