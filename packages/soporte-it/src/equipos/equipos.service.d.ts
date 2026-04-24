import { Repository } from 'typeorm';
import { EquipoEntity } from '../entities/equipo.entity';
import { CreateEquipoDto } from './dto/create-equipo.dto';
import { UpdateEquipoDto } from './dto/update-equipo.dto';
export declare class EquiposService {
    private readonly equipos;
    constructor(equipos: Repository<EquipoEntity>);
    findAll(): Promise<EquipoEntity[]>;
    /** Equipos asignados a un usuario de la plataforma */
    findByUsuario(usuarioPlatId: string): Promise<EquipoEntity[]>;
    findOne(id: string): Promise<EquipoEntity>;
    create(dto: CreateEquipoDto): Promise<EquipoEntity>;
    update(id: string, dto: UpdateEquipoDto): Promise<EquipoEntity>;
    remove(id: string): Promise<void>;
}
//# sourceMappingURL=equipos.service.d.ts.map