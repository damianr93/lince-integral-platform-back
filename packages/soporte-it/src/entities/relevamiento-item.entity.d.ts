import { RelevamientoEntity } from './relevamiento.entity';
export declare class RelevamientoItemEntity {
    id: string;
    relevamiento: RelevamientoEntity;
    relevamientoId: string;
    /** Orden de aparición del ítem en el informe */
    orden: number;
    /** Título de la sección (ej: "Visor de eventos (Event Viewer)") */
    titulo: string;
    /** Procedimiento o comando ejecutado */
    procedimiento: string | null;
    /** Observación del técnico */
    observacion: string | null;
    /** Conclusión parcial de este ítem */
    conclusion: string | null;
}
//# sourceMappingURL=relevamiento-item.entity.d.ts.map