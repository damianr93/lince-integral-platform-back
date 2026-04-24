import { AuthUser } from '@lince/types';
import { EquiposService } from './equipos.service';
import { CreateEquipoDto } from './dto/create-equipo.dto';
import { UpdateEquipoDto } from './dto/update-equipo.dto';
export declare class EquiposController {
    private readonly equiposService;
    constructor(equiposService: EquiposService);
    /** Lista todos los equipos — solo SUPERADMIN */
    findAll(): Promise<import("..").EquipoEntity[]>;
    /** Equipos asignados al usuario autenticado */
    findMine(user: AuthUser): Promise<import("..").EquipoEntity[]>;
    /** Detalle de un equipo — SUPERADMIN ve cualquiera; usuario solo los suyos */
    findOne(id: string, user: AuthUser): Promise<import("..").EquipoEntity | {
        message: string;
    }>;
    create(dto: CreateEquipoDto): Promise<import("..").EquipoEntity>;
    update(id: string, dto: UpdateEquipoDto): Promise<import("..").EquipoEntity>;
    remove(id: string): Promise<void>;
}
//# sourceMappingURL=equipos.controller.d.ts.map