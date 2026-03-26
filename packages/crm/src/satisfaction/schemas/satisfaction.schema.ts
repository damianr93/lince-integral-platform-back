import { Schema } from 'mongoose';

export interface Satisfaction extends Document {
  name?: string;
  phone?: string;
  product?: string;
  comoNosConocio?:
    | 'VISITA_VENDEDOR'
    | 'RECOMENDACION_COLEGA'
    | 'VENDEDOR'
    | 'WEB'
    | 'EXPOSICIONES'
    | String;
  productoComprado?: boolean;
  calidad?: number;
  tiempoForme?: number;
  atencion?: number;
  recomendacion?: 'SI' | 'NO' | 'MAYBE';
  anteInconvenientes?: 'EXCELENTE' | 'BUENA' | 'MALA' | 'N_A';
  valoracion?:
    | 'CALIDAD'
    | 'TIEMPO_ENTREGA'
    | 'ATENCION'
    | 'RESOLUCION_INCONVENIENTES';
  comentarios?: string;
}

export const SatisfactionSchema = new Schema<Satisfaction>(
  {
    name: { type: String },
    phone: { type: String },
    product: { type: String },
    comoNosConocio: {
      type: String,
      enum: [
        'VISITA_VENDEDOR',
        'RECOMENDACION_COLEGA',
        'VENDEDOR',
        'WEB',
        'EXPOSICIONES',
      ],
    },
    productoComprado: { type: Boolean },
    calidad: { type: Number, min: 1, max: 5 },
    tiempoForme: { type: Number, min: 1, max: 5 },
    atencion: { type: Number, min: 1, max: 5 },
    recomendacion: { type: String, enum: ['SI', 'NO', 'MAYBE'] },
    anteInconvenientes: {
      type: String,
      enum: ['EXCELENTE', 'BUENA', 'MALA', 'N_A'],
    },
    valoracion: {
      type: String,
      enum: [
        'CALIDAD',
        'TIEMPO_ENTREGA',
        'ATENCION',
        'RESOLUCION_INCONVENIENTES',
        'SIN_VALORACION',
      ],
    },
    comentarios: { type: String },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'satisfactions',
  },
);

SatisfactionSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform(_doc, ret: Record<string, any>) {
    ret['id'] = ret['_id']?.toString();
    delete ret['_id'];
  },
});
