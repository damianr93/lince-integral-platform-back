import { Schema } from 'mongoose';
export interface Satisfaction extends Document {
    name?: string;
    phone?: string;
    product?: string;
    comoNosConocio?: 'VISITA_VENDEDOR' | 'RECOMENDACION_COLEGA' | 'VENDEDOR' | 'WEB' | 'EXPOSICIONES' | String;
    productoComprado?: boolean;
    calidad?: number;
    tiempoForme?: number;
    atencion?: number;
    recomendacion?: 'SI' | 'NO' | 'MAYBE';
    anteInconvenientes?: 'EXCELENTE' | 'BUENA' | 'MALA' | 'N_A';
    valoracion?: 'CALIDAD' | 'TIEMPO_ENTREGA' | 'ATENCION' | 'RESOLUCION_INCONVENIENTES';
    comentarios?: string;
}
export declare const SatisfactionSchema: Schema<Satisfaction, import("mongoose").Model<Satisfaction, any, any, any, import("mongoose").Document<unknown, any, Satisfaction, any, {}> & Satisfaction & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Satisfaction, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<Satisfaction>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Satisfaction> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
//# sourceMappingURL=satisfaction.schema.d.ts.map