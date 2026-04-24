import { Repository } from 'typeorm';
import { AuthUser } from '@lince/types';
import { IncidenteEntity } from '../entities/incidente.entity';
import { EquiposService } from '../equipos/equipos.service';
import { CreateIncidenteDto } from './dto/create-incidente.dto';
import { UpdateIncidenteDto } from './dto/update-incidente.dto';
export declare class IncidentesService {
    private readonly incidentes;
    private readonly equiposService;
    constructor(incidentes: Repository<IncidenteEntity>, equiposService: EquiposService);
    /** Todos los incidentes — solo superadmin */
    findAll(): Promise<IncidenteEntity[]>;
    /** Incidentes de los equipos asignados al usuario */
    findByUsuario(userId: string): Promise<IncidenteEntity[]>;
    /** Incidentes de un equipo específico */
    findByEquipo(equipoId: string): Promise<IncidenteEntity[]>;
    findOne(id: string): Promise<IncidenteEntity>;
    create(dto: CreateIncidenteDto, user: AuthUser): Promise<IncidenteEntity>;
    update(id: string, dto: UpdateIncidenteDto, user: AuthUser): Promise<IncidenteEntity>;
    remove(id: string, user: AuthUser): Promise<void>;
}
//# sourceMappingURL=incidentes.service.d.ts.map