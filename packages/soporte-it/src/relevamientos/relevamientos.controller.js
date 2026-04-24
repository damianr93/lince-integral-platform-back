"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelevamientosController = void 0;
const common_1 = require("@nestjs/common");
const auth_1 = require("@lince/auth");
const types_1 = require("@lince/types");
const relevamientos_service_1 = require("./relevamientos.service");
const create_relevamiento_dto_1 = require("./dto/create-relevamiento.dto");
const update_relevamiento_dto_1 = require("./dto/update-relevamiento.dto");
let RelevamientosController = class RelevamientosController {
    constructor(relevamientosService) {
        this.relevamientosService = relevamientosService;
    }
    /** Obtener relevamiento por ID */
    findOne(id, user) {
        return this.relevamientosService.findOneForUser(id, user);
    }
    /** Obtener relevamiento de un incidente */
    findByIncidente(incidenteId, user) {
        return this.relevamientosService.findByIncidenteForUser(incidenteId, user);
    }
    /** Crear relevamiento — solo SUPERADMIN */
    create(dto, user) {
        return this.relevamientosService.create(dto, user);
    }
    /** Editar relevamiento — solo SUPERADMIN */
    update(id, dto) {
        return this.relevamientosService.update(id, dto);
    }
};
exports.RelevamientosController = RelevamientosController;
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, auth_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RelevamientosController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('incidente/:incidenteId'),
    __param(0, (0, common_1.Param)('incidenteId', common_1.ParseUUIDPipe)),
    __param(1, (0, auth_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RelevamientosController.prototype, "findByIncidente", null);
__decorate([
    (0, common_1.Post)(),
    (0, auth_1.Roles)(types_1.GlobalRole.SUPERADMIN),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, auth_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_relevamiento_dto_1.CreateRelevamientoDto, Object]),
    __metadata("design:returntype", void 0)
], RelevamientosController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, auth_1.Roles)(types_1.GlobalRole.SUPERADMIN),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_relevamiento_dto_1.UpdateRelevamientoDto]),
    __metadata("design:returntype", void 0)
], RelevamientosController.prototype, "update", null);
exports.RelevamientosController = RelevamientosController = __decorate([
    (0, common_1.Controller)('soporte-it/relevamientos'),
    (0, common_1.UseGuards)(auth_1.JwtAuthGuard, auth_1.ModuleGuard, auth_1.RolesGuard),
    (0, auth_1.RequireModule)(types_1.ModuleKey.SOPORTE_IT),
    __metadata("design:paramtypes", [relevamientos_service_1.RelevamientosService])
], RelevamientosController);
//# sourceMappingURL=relevamientos.controller.js.map