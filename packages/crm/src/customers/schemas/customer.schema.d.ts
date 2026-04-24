import { Schema, Document } from 'mongoose';
export interface Customer extends Document {
    nombre?: string;
    apellido?: string;
    telefono: string;
    correo?: string;
    cabezas?: string;
    mesesSuplemento?: string;
    producto?: string;
    localidad?: string;
    provincia?: string;
    ubicacion?: {
        pais?: string;
        provincia?: string;
        localidad?: string;
        zona?: string;
        lat?: number;
        lon?: number;
        displayName?: string;
        fuente?: string;
        esNormalizada?: boolean;
        normalizacionFallidaAt?: Date;
    };
    actividad?: 'CRIA' | 'RECRIA' | 'MIXTO' | 'DISTRIBUIDOR';
    medioAdquisicion?: 'INSTAGRAM' | 'WEB' | 'WHATSAPP' | 'FACEBOOK' | 'OTRO';
    estado?: 'PENDIENTE' | 'DERIVADO_A_DISTRIBUIDOR' | 'NO_CONTESTO' | 'SE_COTIZO_Y_PENDIENTE' | 'SE_COTIZO_Y_NO_INTERESO' | 'COMPRO';
    siguiendo?: 'EZEQUIEL' | 'DENIS' | 'MARTIN' | 'SIN_ASIGNAR';
    observaciones?: string;
    createdAt?: Date;
    isReconsulta?: boolean;
}
export declare const CustomerSchema: Schema<Customer, import("mongoose").Model<Customer, any, any, any, Document<unknown, any, Customer, any, {}> & Customer & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Customer, Document<unknown, {}, import("mongoose").FlatRecord<Customer>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Customer> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
//# sourceMappingURL=customer.schema.d.ts.map