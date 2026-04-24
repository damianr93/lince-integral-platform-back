import { Repository } from 'typeorm';
import { FichajeEntity, EstadoFichaje } from '../entities/fichaje.entity';
import { Planta } from '../entities/empleado.entity';
export interface FichajesFilter {
    planta?: Planta;
    empleadoId?: string;
    pin?: string;
    desde?: Date;
    hasta?: Date;
    estado?: EstadoFichaje;
    page?: number;
    limit?: number;
}
export interface UpdateFichajeInput {
    estado?: EstadoFichaje;
    tiempo?: Date;
    empleadoId?: string | null;
}
export declare class LogsService {
    private readonly repo;
    constructor(repo: Repository<FichajeEntity>);
    findAll(filter?: FichajesFilter): Promise<{
        items: FichajeEntity[];
        total: number;
    }>;
    updateById(id: string, input: UpdateFichajeInput): Promise<FichajeEntity>;
    findToday(planta?: Planta): Promise<FichajeEntity[]>;
    findByEmployee(empleadoId: string, limit?: number): Promise<FichajeEntity[]>;
    /** Último fichaje de cada PIN hoy — para determinar quién está en planta */
    getLastPunchesPerPin(planta?: Planta): Promise<FichajeEntity[]>;
}
//# sourceMappingURL=logs.service.d.ts.map