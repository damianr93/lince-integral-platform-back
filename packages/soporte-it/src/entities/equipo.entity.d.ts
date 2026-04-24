import { UserEntity } from '@lince/database';
import { IncidenteEntity } from './incidente.entity';
export type EstadoEquipo = 'activo' | 'en_reparacion' | 'baja';
export declare class EquipoEntity {
    id: string;
    /** Número de activo (del Excel: columna "id") */
    numeroActivo: number | null;
    /** Persona a cargo (del Excel: "A CARGO DE:") */
    aCargoDe: string | null;
    /** Sector/departamento (del Excel: "SECTOR") */
    sector: string | null;
    /** Hostname del equipo (del Excel: "NAME") */
    hostname: string | null;
    /** Windows user/ID (del Excel: "USER_ID") */
    windowsUserId: string | null;
    /** Fabricante (del Excel: "FABRICANTE") */
    fabricante: string | null;
    /** Modelo (del Excel: "MODELO") */
    modelo: string | null;
    /** RAM en GB (del Excel: "RAM_GB") */
    ramGb: string | null;
    /** Sistema operativo (del Excel: "SO") */
    sistemaOperativo: string | null;
    /** Procesador (del Excel: "PROCESADOR") */
    procesador: string | null;
    /** Firmware UEFI/BIOS */
    firmwareUefi: string | null;
    /** Tarjeta gráfica (del Excel: "GRAPHICS") */
    graficos: string | null;
    /** Almacenamiento (del Excel: "ALMACENAMIENTO") */
    almacenamiento: string | null;
    /** Adaptador de red (del Excel: "ADAPTADOR DE RED") */
    adaptadorRed: string | null;
    /** IPv6 */
    ipv6: string | null;
    /** Controlador de host USB */
    controladorUsbHost: string | null;
    /** Estado del equipo */
    estado: EstadoEquipo;
    /** Notas adicionales */
    notas: string | null;
    /** Usuario de la plataforma asignado a este equipo (relación opcional) */
    usuarioPlat: UserEntity | null;
    usuarioPlatId: string | null;
    incidentes: IncidenteEntity[];
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=equipo.entity.d.ts.map