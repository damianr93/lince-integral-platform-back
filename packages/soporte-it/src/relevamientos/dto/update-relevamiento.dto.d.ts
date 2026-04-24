export declare class UpsertRelevamientoItemDto {
    id?: string;
    orden: number;
    titulo: string;
    procedimiento?: string;
    observacion?: string;
    conclusion?: string;
}
export declare class UpdateRelevamientoDto {
    fecha?: string;
    modalidad?: string;
    conclusionGeneral?: string;
    pasosASeguir?: string;
    recomendaciones?: string;
    /** Reemplaza todos los ítems del relevamiento */
    items?: UpsertRelevamientoItemDto[];
}
//# sourceMappingURL=update-relevamiento.dto.d.ts.map