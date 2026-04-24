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
exports.IncidentesController = void 0;
const common_1 = require("@nestjs/common");
const auth_1 = require("@lince/auth");
const types_1 = require("@lince/types");
const incidentes_service_1 = require("./incidentes.service");
const create_incidente_dto_1 = require("./dto/create-incidente.dto");
const update_incidente_dto_1 = require("./dto/update-incidente.dto");
let IncidentesController = class IncidentesController {
    constructor(incidentesService) {
        this.incidentesService = incidentesService;
    }
    /** Lista todos los incidentes — solo SUPERADMIN */
    findAll() {
        return this.incidentesService.findAll();
    }
    /** Incidentes de los equipos del usuario autenticado */
    findMine(user) {
        return this.incidentesService.findByUsuario(user.id);
    }
    /** Incidentes de un equipo específico */
    findByEquipo(equipoId) {
        return this.incidentesService.findByEquipo(equipoId);
    }
    async findOne(id, user) {
        const incidente = await this.incidentesService.findOne(id);
        if (user.globalRole !== types_1.GlobalRole.SUPERADMIN) {
            if (incidente.equipo?.usuarioPlatId !== user.id) {
                throw new common_1.ForbiddenException('No tenés acceso a este incidente');
            }
        }
        return incidente;
    }
    /** Reportar un nuevo incidente — cualquier usuario con acceso al módulo */
    create(dto, user) {
        return this.incidentesService.create(dto, user);
    }
    /** Actualizar estado del incidente — solo SUPERADMIN */
    update(id, dto, user) {
        return this.incidentesService.update(id, dto, user);
    }
    remove(id, user) {
        return this.incidentesService.remove(id, user);
    }
};
exports.IncidentesController = IncidentesController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(auth_1.RolesGuard),
    (0, auth_1.Roles)(types_1.GlobalRole.SUPERADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], IncidentesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('mis-incidentes'),
    __param(0, (0, auth_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], IncidentesController.prototype, "findMine", null);
__decorate([
    (0, common_1.Get)('equipo/:equipoId'),
    __param(0, (0, common_1.Param)('equipoId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], IncidentesController.prototype, "findByEquipo", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, auth_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], IncidentesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, auth_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_incidente_dto_1.CreateIncidenteDto, Object]),
    __metadata("design:returntype", void 0)
], IncidentesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, auth_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_incidente_dto_1.UpdateIncidenteDto, Object]),
    __metadata("design:returntype", void 0)
], IncidentesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, auth_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], IncidentesController.prototype, "remove", null);
exports.IncidentesController = IncidentesController = __decorate([
    (0, common_1.Controller)('soporte-it/incidentes'),
    (0, common_1.UseGuards)(auth_1.JwtAuthGuard, auth_1.ModuleGuard),
    (0, auth_1.RequireModule)(types_1.ModuleKey.SOPORTE_IT),
    __metadata("design:paramtypes", [incidentes_service_1.IncidentesService])
], IncidentesController);
//# sourceMappingURL=incidentes.controller.js.map