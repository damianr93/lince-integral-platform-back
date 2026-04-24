import { Planta } from '../entities/empleado.entity';
import { LogsService } from './logs.service';
import { UpdateFichajeDto } from './dto/update-fichaje.dto';
export declare class LogsController {
    private readonly service;
    constructor(service: LogsService);
    findAll(planta?: Planta, empleadoId?: string, pin?: string, desde?: string, hasta?: string, estado?: string, page?: string, limit?: string): Promise<{
        items: import("../entities/fichaje.entity").FichajeEntity[];
        total: number;
        page: number;
        limit: number;
        pages: number;
    }>;
    updateById(id: string, dto: UpdateFichajeDto): Promise<import("../entities/fichaje.entity").FichajeEntity>;
}
//# sourceMappingURL=logs.controller.d.ts.map