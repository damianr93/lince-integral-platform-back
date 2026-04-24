export declare enum ComoNosConocio {
    VISITA_VENDEDOR = "VISITA_VENDEDOR",
    RECOMENDACION_COLEGA = "RECOMENDACION_COLEGA",
    VENDEDOR = "VENDEDOR",
    WEB = "WEB",
    EXPOSICIONES = "EXPOSICIONES"
}
export declare enum Recomendacion {
    SI = "SI",
    NO = "NO",
    MAYBE = "MAYBE"
}
export declare enum AnteInconvenientes {
    EXCELENTE = "EXCELENTE",
    BUENA = "BUENA",
    MALA = "MALA",
    N_A = "N_A"
}
export declare enum Valoracion {
    CALIDAD = "CALIDAD",
    TIEMPO_ENTREGA = "TIEMPO_ENTREGA",
    ATENCION = "ATENCION",
    RESOLUCION_INCONVENIENTES = "RESOLUCION_INCONVENIENTES",
    SIN_VALORACION = "SIN_VALORACION"
}
export declare class CreateSatisfactionDto {
    phone?: string;
    producto?: string;
    comoNosConocio?: ComoNosConocio;
    productoComprado?: boolean;
    nombreProducto?: string;
    calidad?: number;
    tiempoForme?: number;
    atencion?: number;
    recomendacion?: Recomendacion;
    anteInconvenientes?: AnteInconvenientes;
    valoracion?: Valoracion;
    comentarios?: string;
}
//# sourceMappingURL=create-satisfaction.dto.d.ts.map