import { AuthUser } from '@lince/types';
import { IncidentesService } from './incidentes.service';
import { CreateIncidenteDto } from './dto/create-incidente.dto';
import { UpdateIncidenteDto } from './dto/update-incidente.dto';
export declare class IncidentesController {
    private readonly incidentesService;
    constructor(incidentesService: IncidentesService);
    /** Lista todos los incidentes — solo SUPERADMIN */
    findAll(): Promise<import("..").IncidenteEntity[]>;
    /** Incidentes de los equipos del usuario autenticado */
    findMine(user: AuthUser): Promise<import("..").IncidenteEntity[]>;
    /** Incidentes de un equipo específico */
    findByEquipo(equipoId: string): Promise<import("..").IncidenteEntity[]>;
    findOne(id: string, user: AuthUser): Promise<import("..").IncidenteEntity>;
    /** Reportar un nuevo incidente — cualquier usuario con acceso al módulo */
    create(dto: CreateIncidenteDto, user: AuthUser): Promise<import("..").IncidenteEntity>;
    /** Actualizar estado del incidente — solo SUPERADMIN */
    update(id: string, dto: UpdateIncidenteDto, user: AuthUser): Promise<import("..").IncidenteEntity>;
    remove(id: string, user: AuthUser): Promise<void>;
}
//# sourceMappingURL=incidentes.controller.d.ts.map