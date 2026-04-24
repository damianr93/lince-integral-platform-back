"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelevamientosModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const relevamiento_entity_1 = require("../entities/relevamiento.entity");
const relevamiento_item_entity_1 = require("../entities/relevamiento-item.entity");
const incidentes_module_1 = require("../incidentes/incidentes.module");
const relevamientos_controller_1 = require("./relevamientos.controller");
const relevamientos_service_1 = require("./relevamientos.service");
let RelevamientosModule = class RelevamientosModule {
};
exports.RelevamientosModule = RelevamientosModule;
exports.RelevamientosModule = RelevamientosModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([relevamiento_entity_1.RelevamientoEntity, relevamiento_item_entity_1.RelevamientoItemEntity]),
            incidentes_module_1.IncidentesModule,
        ],
        controllers: [relevamientos_controller_1.RelevamientosController],
        providers: [relevamientos_service_1.RelevamientosService],
    })
], RelevamientosModule);
//# sourceMappingURL=relevamientos.module.js.map