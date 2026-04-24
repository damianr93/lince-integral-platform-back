"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IncidentesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const incidente_entity_1 = require("../entities/incidente.entity");
const equipos_module_1 = require("../equipos/equipos.module");
const incidentes_controller_1 = require("./incidentes.controller");
const incidentes_service_1 = require("./incidentes.service");
let IncidentesModule = class IncidentesModule {
};
exports.IncidentesModule = IncidentesModule;
exports.IncidentesModule = IncidentesModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([incidente_entity_1.IncidenteEntity]), equipos_module_1.EquiposModule],
        controllers: [incidentes_controller_1.IncidentesController],
        providers: [incidentes_service_1.IncidentesService],
        exports: [incidentes_service_1.IncidentesService],
    })
], IncidentesModule);
//# sourceMappingURL=incidentes.module.js.map