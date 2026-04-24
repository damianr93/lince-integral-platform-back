import { UserEntity } from '@lince/database';
import { EquipoEntity } from './equipo.entity';
import { RelevamientoEntity } from './relevamiento.entity';
export type UrgenciaIncidente = 'baja' | 'media' | 'alta';
export type EstadoIncidente = 'pending' | 'in_progress' | 'resolved';
export declare class IncidenteEntity {
    id: string;
    /** Número de reporte secuencial visible al usuario (asignado por el service) */
    numeroReporte: number;
    /** Equipo afectado */
    equipo: EquipoEntity;
    equipoId: string;
    /** Usuario que reportó el incidente */
    reportadoPor: UserEntity | null;
    reportadoPorId: string | null;
    /** Descripción libre del problema */
    descripcion: string;
    /** Urgencia percibida por el usuario */
    urgencia: UrgenciaIncidente;
    /** Estado del flujo */
    estado: EstadoIncidente;
    /** Fecha en que ocurrió/se notó el problema (editable) */
    fechaReporte: Date;
    /** Aplicaciones afectadas (opcional) */
    aplicacionesAfectadas: string | null;
    /** Acciones previas realizadas por el usuario */
    accionesPrevias: string | null;
    /** Relevamiento técnico asociado (creado por superadmin) */
    relevamiento: RelevamientoEntity | null;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=incidente.entity.d.ts.map