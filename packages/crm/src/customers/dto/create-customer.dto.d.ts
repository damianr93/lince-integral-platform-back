export declare enum Actividad {
    CRIA = "CRIA",
    RECRIA = "RECRIA",
    MIXTO = "MIXTO",
    DISTRIBUIDOR = "DISTRIBUIDOR"
}
export declare class UbicacionDto {
    pais?: string;
    provincia?: string;
    localidad?: string;
    zona?: string;
    lat?: number;
    lon?: number;
    displayName?: string;
    fuente?: string;
    esNormalizada?: boolean;
}
export declare class CreateCustomerDto {
    nombre?: string;
    apellido?: string;
    telefono: string;
    correo?: string;
    cabezas?: string;
    mesesSuplemento?: string;
    producto?: string;
    localidad?: string;
    provincia?: string;
    ubicacion?: UbicacionDto;
    actividad?: Actividad;
    observaciones?: string;
    siguiendo?: 'EZEQUIEL' | 'DENIS' | 'MARTIN' | 'SIN_ASIGNAR';
    medioAdquisicion?: 'INSTAGRAM' | 'WEB' | 'WHATSAPP' | 'FACEBOOK' | 'OTRO';
    estado?: 'PENDIENTE' | 'DERIVADO_A_DISTRIBUIDOR' | 'NO_CONTESTO' | 'SE_COTIZO_Y_PENDIENTE' | 'SE_COTIZO_Y_NO_INTERESO' | 'COMPRO';
    createdAt?: string;
    isReconsulta?: boolean;
}
//# sourceMappingURL=create-customer.dto.d.ts.map