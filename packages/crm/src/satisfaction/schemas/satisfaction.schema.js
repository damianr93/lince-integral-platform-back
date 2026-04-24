"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SatisfactionSchema = void 0;
const mongoose_1 = require("mongoose");
exports.SatisfactionSchema = new mongoose_1.Schema({
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
}, {
    timestamps: true,
    versionKey: false,
    collection: 'satisfactions',
});
exports.SatisfactionSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform(_doc, ret) {
        ret['id'] = ret['_id']?.toString();
        delete ret['_id'];
    },
});
//# sourceMappingURL=satisfaction.schema.js.map