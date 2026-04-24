"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerSchema = void 0;
const mongoose_1 = require("mongoose");
exports.CustomerSchema = new mongoose_1.Schema({
    nombre: { type: String },
    apellido: { type: String },
    telefono: { type: String, required: true },
    correo: { type: String, lowercase: true },
    cabezas: { type: String },
    mesesSuplemento: {
        type: String,
    },
    producto: { type: String },
    localidad: { type: String },
    provincia: { type: String },
    ubicacion: {
        pais: { type: String },
        provincia: { type: String },
        localidad: { type: String },
        zona: { type: String },
        lat: { type: Number },
        lon: { type: Number },
        displayName: { type: String },
        fuente: { type: String },
        esNormalizada: { type: Boolean, default: false },
        normalizacionFallidaAt: { type: Date },
    },
    actividad: {
        type: String,
        enum: ['CRIA', 'RECRIA', 'MIXTO', 'DISTRIBUIDOR'],
    },
    medioAdquisicion: {
        type: String,
        enum: ['INSTAGRAM', 'WEB', 'WHATSAPP', 'FACEBOOK', 'OTRO'],
        default: 'OTRO',
    },
    estado: {
        type: String,
        enum: ['PENDIENTE', 'DERIVADO_A_DISTRIBUIDOR', 'NO_CONTESTO', 'SE_COTIZO_Y_PENDIENTE', 'SE_COTIZO_Y_NO_INTERESO', 'COMPRO'],
        default: 'PENDIENTE',
    },
    siguiendo: {
        type: String,
        enum: ['EZEQUIEL', 'DENIS', 'MARTIN', 'SIN_ASIGNAR'],
        default: 'SIN_ASIGNAR',
    },
    observaciones: String,
    createdAt: {
        type: Date,
        default: Date.now,
        immutable: false,
    },
    isReconsulta: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: { createdAt: false, updatedAt: true },
    collection: 'clients',
});
exports.CustomerSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform(_doc, ret) {
        ret['id'] = ret['_id']?.toString();
        delete ret['_id'];
    },
});
//# sourceMappingURL=customer.schema.js.map