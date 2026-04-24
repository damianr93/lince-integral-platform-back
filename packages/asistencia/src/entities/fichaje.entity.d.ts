import { EmpleadoEntity, Planta } from './empleado.entity';
export declare enum EstadoFichaje {
    ENTRADA = 0,
    SALIDA = 1
}
export declare class FichajeEntity {
    id: string;
    /** Empleado resuelto por PIN — puede ser null si el PIN no está registrado */
    empleado: EmpleadoEntity | null;
    empleadoId: string | null;
    /** PIN tal como llega del reloj */
    pin: string;
    /** Timestamp del fichaje (lo manda el reloj) */
    tiempo: Date;
    /** 0 = entrada, 1 = salida */
    estado: EstadoFichaje;
    /** Método de verificación del reloj (0=contraseña, 1=huella, 4=cara, 15=biométrico) */
    verify: number | null;
    /** Serial number del dispositivo ZKTeco */
    deviceSn: string | null;
    planta: Planta | null;
    /** Payload crudo recibido del reloj, para auditoría */
    rawPayload: string | null;
    createdAt: Date;
}
//# sourceMappingURL=fichaje.entity.d.ts.map