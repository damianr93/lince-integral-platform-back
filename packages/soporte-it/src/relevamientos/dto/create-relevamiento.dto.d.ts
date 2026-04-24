export declare class CreateRelevamientoItemDto {
    orden: number;
    titulo: string;
    procedimiento?: string;
    observacion?: string;
    conclusion?: string;
}
export declare class CreateRelevamientoDto {
    incidenteId: string;
    fecha?: string;
    modalidad?: string;
    conclusionGeneral?: string;
    pasosASeguir?: string;
    recomendaciones?: string;
    items?: CreateRelevamientoItemDto[];
}
//# sourceMappingURL=create-relevamiento.dto.d.ts.map