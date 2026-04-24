import { Repository } from 'typeorm';
import { AuthUser } from '@lince/types';
import { RelevamientoEntity } from '../entities/relevamiento.entity';
import { RelevamientoItemEntity } from '../entities/relevamiento-item.entity';
import { IncidentesService } from '../incidentes/incidentes.service';
import { CreateRelevamientoDto } from './dto/create-relevamiento.dto';
import { UpdateRelevamientoDto } from './dto/update-relevamiento.dto';
export declare class RelevamientosService {
    private readonly relevamientos;
    private readonly items;
    private readonly incidentesService;
    constructor(relevamientos: Repository<RelevamientoEntity>, items: Repository<RelevamientoItemEntity>, incidentesService: IncidentesService);
    findOne(id: string): Promise<RelevamientoEntity>;
    findByIncidente(incidenteId: string): Promise<RelevamientoEntity | null>;
    private assertCanReadIncidente;
    findOneForUser(id: string, user: AuthUser): Promise<RelevamientoEntity>;
    findByIncidenteForUser(incidenteId: string, user: AuthUser): Promise<RelevamientoEntity | null>;
    create(dto: CreateRelevamientoDto, user: AuthUser): Promise<RelevamientoEntity>;
    update(id: string, dto: UpdateRelevamientoDto): Promise<RelevamientoEntity>;
}
//# sourceMappingURL=relevamientos.service.d.ts.map