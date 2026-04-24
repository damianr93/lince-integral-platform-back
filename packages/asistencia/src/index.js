"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asistenciaEntities = exports.RawLogEntity = exports.EstadoFichaje = exports.FichajeEntity = exports.Planta = exports.EmpleadoEntity = exports.AsistenciaModule = void 0;
var asistencia_module_1 = require("./asistencia.module");
Object.defineProperty(exports, "AsistenciaModule", { enumerable: true, get: function () { return asistencia_module_1.AsistenciaModule; } });
var empleado_entity_1 = require("./entities/empleado.entity");
Object.defineProperty(exports, "EmpleadoEntity", { enumerable: true, get: function () { return empleado_entity_1.EmpleadoEntity; } });
Object.defineProperty(exports, "Planta", { enumerable: true, get: function () { return empleado_entity_1.Planta; } });
var fichaje_entity_1 = require("./entities/fichaje.entity");
Object.defineProperty(exports, "FichajeEntity", { enumerable: true, get: function () { return fichaje_entity_1.FichajeEntity; } });
Object.defineProperty(exports, "EstadoFichaje", { enumerable: true, get: function () { return fichaje_entity_1.EstadoFichaje; } });
var raw_log_entity_1 = require("./entities/raw-log.entity");
Object.defineProperty(exports, "RawLogEntity", { enumerable: true, get: function () { return raw_log_entity_1.RawLogEntity; } });
exports.asistenciaEntities = [
    EmpleadoEntity,
    FichajeEntity,
    RawLogEntity,
];
//# sourceMappingURL=index.js.map