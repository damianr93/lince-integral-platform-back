import { ReportsService } from './reports.service';
import { Planta } from '../entities/empleado.entity';
export declare class ReportsController {
    private readonly service;
    constructor(service: ReportsService);
    /** GET /api/asistencia/reports/present-now?planta=tucuman */
    getPresentNow(planta?: Planta): Promise<import("./reports.service").EmpleadoPresente[]>;
    /** GET /api/asistencia/reports/daily-summary?planta=villa_nueva */
    getDailySummary(planta?: Planta): Promise<import("./reports.service").ResumenDiario>;
    /** GET /api/asistencia/reports/attendance?planta=tucuman&desde=2025-01-01&hasta=2025-01-31 */
    getAttendance(planta?: Planta, empleadoId?: string, desde?: string, hasta?: string, estado?: string, page?: number, limit?: number): Promise<{
        items: import("..").FichajeEntity[];
        total: number;
    }>;
    /** GET /api/asistencia/reports/employee/:id/history */
    getEmployeeHistory(id: string, limit?: number): Promise<import("..").FichajeEntity[]>;
}
//# sourceMappingURL=reports.controller.d.ts.map