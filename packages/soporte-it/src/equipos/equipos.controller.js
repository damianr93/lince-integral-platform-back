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
exports.EquiposController = void 0;
const common_1 = require("@nestjs/common");
const auth_1 = require("@lince/auth");
const types_1 = require("@lince/types");
const equipos_service_1 = require("./equipos.service");
const create_equipo_dto_1 = require("./dto/create-equipo.dto");
const update_equipo_dto_1 = require("./dto/update-equipo.dto");
let EquiposController = class EquiposController {
    constructor(equiposService) {
        this.equiposService = equiposService;
    }
    /** Lista todos los equipos — solo SUPERADMIN */
    findAll() {
        return this.equiposService.findAll();
    }
    /** Equipos asignados al usuario autenticado */
    findMine(user) {
        return this.equiposService.findByUsuario(user.id);
    }
    /** Detalle de un equipo — SUPERADMIN ve cualquiera; usuario solo los suyos */
    async findOne(id, user) {
        const equipo = await this.equiposService.findOne(id);
        if (user.globalRole !== types_1.GlobalRole.SUPERADMIN) {
            if (equipo.usuarioPlatId !== user.id) {
                // TODO-4 [MEDIO]: Este return devuelve HTTP 200 con un objeto de error —
                // eso está mal. El cliente recibe "éxito" (200) pero con un mensaje de
                // denegación adentro. Cualquier frontend o herramienta que chequee el
                // status code va a pensar que la request funcionó.
                //
                // En HTTP, "acceso denegado" se representa con el código 403 Forbidden.
                // NestJS tiene una excepción para eso que podés importar de @nestjs/common.
                //
                // Tu tarea: reemplazá este return por el lanzamiento de la excepción
                // correcta. Fijate cómo se hace en otros controllers del proyecto
                // (pista: buscá ForbiddenException o NotFoundException como ejemplo
                // del patrón — ya están en uso en equipos.service.ts y en otros lados).
                return { message: 'Acceso denegado' };
            }
        }
        return equipo;
    }
    create(dto) {
        return this.equiposService.create(dto);
    }
    update(id, dto) {
        return this.equiposService.update(id, dto);
    }
    remove(id) {
        return this.equiposService.remove(id);
    }
};
exports.EquiposController = EquiposController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(auth_1.RolesGuard),
    (0, auth_1.Roles)(types_1.GlobalRole.SUPERADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], EquiposController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('mis-equipos'),
    __param(0, (0, auth_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EquiposController.prototype, "findMine", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, auth_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EquiposController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(auth_1.RolesGuard),
    (0, auth_1.Roles)(types_1.GlobalRole.SUPERADMIN),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_equipo_dto_1.CreateEquipoDto]),
    __metadata("design:returntype", void 0)
], EquiposController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(auth_1.RolesGuard),
    (0, auth_1.Roles)(types_1.GlobalRole.SUPERADMIN),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_equipo_dto_1.UpdateEquipoDto]),
    __metadata("design:returntype", void 0)
], EquiposController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(auth_1.RolesGuard),
    (0, auth_1.Roles)(types_1.GlobalRole.SUPERADMIN),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EquiposController.prototype, "remove", null);
exports.EquiposController = EquiposController = __decorate([
    (0, common_1.Controller)('soporte-it/equipos'),
    (0, common_1.UseGuards)(auth_1.JwtAuthGuard, auth_1.ModuleGuard),
    (0, auth_1.RequireModule)(types_1.ModuleKey.SOPORTE_IT),
    __metadata("design:paramtypes", [equipos_service_1.EquiposService])
], EquiposController);
//# sourceMappingURL=equipos.controller.js.map