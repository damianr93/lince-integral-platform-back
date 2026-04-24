"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SoporteItModule = void 0;
const common_1 = require("@nestjs/common");
const equipos_module_1 = require("./equipos/equipos.module");
const incidentes_module_1 = require("./incidentes/incidentes.module");
const relevamientos_module_1 = require("./relevamientos/relevamientos.module");
let SoporteItModule = class SoporteItModule {
};
exports.SoporteItModule = SoporteItModule;
exports.SoporteItModule = SoporteItModule = __decorate([
    (0, common_1.Module)({
        imports: [equipos_module_1.EquiposModule, incidentes_module_1.IncidentesModule, relevamientos_module_1.RelevamientosModule],
        exports: [equipos_module_1.EquiposModule, incidentes_module_1.IncidentesModule, relevamientos_module_1.RelevamientosModule],
    })
], SoporteItModule);
//# sourceMappingURL=soporte-it.module.js.map