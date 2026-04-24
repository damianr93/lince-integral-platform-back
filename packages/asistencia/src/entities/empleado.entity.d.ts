export declare enum Planta {
    TUCUMAN = "tucuman",
    VILLA_NUEVA = "villa_nueva"
}
export declare class EmpleadoEntity {
    id: string;
    firstName: string;
    lastName: string;
    dni: string | null;
    /** ID numérico registrado en el reloj ZKTeco (campo PIN del dispositivo) */
    pin: string;
    planta: Planta;
    departamento: string | null;
    cargo: string | null;
    activo: boolean;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=empleado.entity.d.ts.map