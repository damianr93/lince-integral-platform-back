import { UserEntity } from '@lince/database';
import { IncidenteEntity } from './incidente.entity';
import { RelevamientoItemEntity } from './relevamiento-item.entity';
export declare class RelevamientoEntity {
    id: string;
    /** Incidente al que pertenece este relevamiento (1-1) */
    incidente: IncidenteEntity;
    incidenteId: string;
    /** Técnico que realizó el relevamiento */
    creadoPor: UserEntity | null;
    creadoPorId: string | null;
    /** Fecha del relevamiento */
    fecha: string;
    /** Modalidad: "Presencial" | "Acceso remoto via AnyDesk" | etc. */
    modalidad: string | null;
    /** Conclusión general del relevamiento */
    conclusionGeneral: string | null;
    /** Pasos a seguir / seguimiento recomendado */
    pasosASeguir: string | null;
    /** Recomendaciones adicionales */
    recomendaciones: string | null;
    /** Ítems dinámicos del diagnóstico */
    items: RelevamientoItemEntity[];
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=relevamiento.entity.d.ts.map