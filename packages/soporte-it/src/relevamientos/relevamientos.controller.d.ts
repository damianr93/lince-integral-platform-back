import { AuthUser } from '@lince/types';
import { RelevamientosService } from './relevamientos.service';
import { CreateRelevamientoDto } from './dto/create-relevamiento.dto';
import { UpdateRelevamientoDto } from './dto/update-relevamiento.dto';
export declare class RelevamientosController {
    private readonly relevamientosService;
    constructor(relevamientosService: RelevamientosService);
    /** Obtener relevamiento por ID */
    findOne(id: string, user: AuthUser): Promise<import("..").RelevamientoEntity>;
    /** Obtener relevamiento de un incidente */
    findByIncidente(incidenteId: string, user: AuthUser): Promise<import("..").RelevamientoEntity | null>;
    /** Crear relevamiento — solo SUPERADMIN */
    create(dto: CreateRelevamientoDto, user: AuthUser): Promise<import("..").RelevamientoEntity>;
    /** Editar relevamiento — solo SUPERADMIN */
    update(id: string, dto: UpdateRelevamientoDto): Promise<import("..").RelevamientoEntity>;
}
//# sourceMappingURL=relevamientos.controller.d.ts.map