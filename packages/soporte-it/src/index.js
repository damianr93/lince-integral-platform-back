"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.soporteItEntities = void 0;
__exportStar(require("./soporte-it.module"), exports);
__exportStar(require("./entities/equipo.entity"), exports);
__exportStar(require("./entities/incidente.entity"), exports);
__exportStar(require("./entities/relevamiento.entity"), exports);
__exportStar(require("./entities/relevamiento-item.entity"), exports);
const equipo_entity_1 = require("./entities/equipo.entity");
const incidente_entity_1 = require("./entities/incidente.entity");
const relevamiento_entity_1 = require("./entities/relevamiento.entity");
const relevamiento_item_entity_1 = require("./entities/relevamiento-item.entity");
exports.soporteItEntities = [
    equipo_entity_1.EquipoEntity,
    incidente_entity_1.IncidenteEntity,
    relevamiento_entity_1.RelevamientoEntity,
    relevamiento_item_entity_1.RelevamientoItemEntity,
];
//# sourceMappingURL=index.js.map