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
exports.LogsController = void 0;
const common_1 = require("@nestjs/common");
const auth_1 = require("@lince/auth");
const empleado_entity_1 = require("../entities/empleado.entity");
const logs_service_1 = require("./logs.service");
const update_fichaje_dto_1 = require("./dto/update-fichaje.dto");
let LogsController = class LogsController {
    constructor(service) {
        this.service = service;
    }
    async findAll(planta, empleadoId, pin, desde, hasta, estado, page, limit) {
        const parsedEstado = estado === undefined || estado === ''
            ? undefined
            : Number(estado);
        const result = await this.service.findAll({
            planta,
            empleadoId,
            pin,
            desde: desde ? new Date(desde) : undefined,
            hasta: hasta ? new Date(hasta) : undefined,
            estado: parsedEstado,
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
        });
        const pageNum = Math.max(1, Number(page) || 1);
        const limitNum = Math.min(200, Math.max(1, Number(limit) || 50));
        const pages = Math.max(1, Math.ceil(result.total / limitNum));
        return {
            items: result.items,
            total: result.total,
            page: pageNum,
            limit: limitNum,
            pages,
        };
    }
    async updateById(id, dto) {
        return this.service.updateById(id, {
            estado: dto.estado,
            tiempo: dto.tiempo ? new Date(dto.tiempo) : undefined,
            empleadoId: dto.empleadoId,
        });
    }
};
exports.LogsController = LogsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('planta')),
    __param(1, (0, common_1.Query)('empleadoId')),
    __param(2, (0, common_1.Query)('pin')),
    __param(3, (0, common_1.Query)('desde')),
    __param(4, (0, common_1.Query)('hasta')),
    __param(5, (0, common_1.Query)('estado')),
    __param(6, (0, common_1.Query)('page')),
    __param(7, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], LogsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_fichaje_dto_1.UpdateFichajeDto]),
    __metadata("design:returntype", Promise)
], LogsController.prototype, "updateById", null);
exports.LogsController = LogsController = __decorate([
    (0, common_1.UseGuards)(auth_1.JwtAuthGuard),
    (0, common_1.Controller)('asistencia/logs'),
    __metadata("design:paramtypes", [logs_service_1.LogsService])
], LogsController);
//# sourceMappingURL=logs.controller.js.map