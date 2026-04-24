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
exports.DebugController = void 0;
const common_1 = require("@nestjs/common");
const auth_1 = require("@lince/auth");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const class_validator_1 = require("class-validator");
const raw_log_entity_1 = require("../entities/raw-log.entity");
const fichaje_entity_1 = require("../entities/fichaje.entity");
const adms_service_1 = require("../adms/adms.service");
const fichaje_entity_2 = require("../entities/fichaje.entity");
class SimulatePunchDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SimulatePunchDto.prototype, "pin", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(fichaje_entity_2.EstadoFichaje),
    __metadata("design:type", Number)
], SimulatePunchDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SimulatePunchDto.prototype, "deviceSn", void 0);
let DebugController = class DebugController {
    constructor(admsService, rawLogRepo, fichajeRepo) {
        this.admsService = admsService;
        this.rawLogRepo = rawLogRepo;
        this.fichajeRepo = fichajeRepo;
    }
    /**
     * GET /api/asistencia/debug/raw-logs
     * Últimos 50 registros crudos del reloj — para diagnóstico durante integración.
     */
    async getRawLogs(limit = 50) {
        return this.rawLogRepo.find({
            order: { createdAt: 'DESC' },
            take: Math.min(Number(limit), 200),
        });
    }
    /**
     * POST /api/asistencia/debug/simulate-punch
     * Simula un fichaje sin necesitar el reloj físico conectado.
     * Body: { pin: "3", status: 0, deviceSn: "SERIAL_TUCUMAN" }
     */
    simulatePunch(dto) {
        return this.admsService.simulatePunch(dto.pin, dto.status, dto.deviceSn);
    }
    /**
     * DELETE /api/asistencia/debug/raw-logs
     * Borra todos los raw logs (útil para limpiar registros de prueba).
     */
    /**
     * GET /api/asistencia/debug/fichajes
     * Últimos 50 fichajes — para ver IDs y diagnóstico.
     */
    async getFichajes(limit = 50) {
        return this.fichajeRepo.find({
            order: { createdAt: 'DESC' },
            take: Math.min(Number(limit), 200),
            relations: ['empleado'],
        });
    }
    async deleteRawLog(id) {
        const result = await this.rawLogRepo.delete(id);
        return { deleted: (result.affected ?? 0) > 0, affected: result.affected };
    }
    async deleteFichaje(id) {
        const result = await this.fichajeRepo.delete(id);
        return { deleted: (result.affected ?? 0) > 0, affected: result.affected };
    }
};
exports.DebugController = DebugController;
__decorate([
    (0, common_1.Get)('raw-logs'),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DebugController.prototype, "getRawLogs", null);
__decorate([
    (0, common_1.Post)('simulate-punch'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [SimulatePunchDto]),
    __metadata("design:returntype", void 0)
], DebugController.prototype, "simulatePunch", null);
__decorate([
    (0, common_1.Get)('fichajes'),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DebugController.prototype, "getFichajes", null);
__decorate([
    (0, common_1.Delete)('raw-logs/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DebugController.prototype, "deleteRawLog", null);
__decorate([
    (0, common_1.Delete)('fichajes/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DebugController.prototype, "deleteFichaje", null);
exports.DebugController = DebugController = __decorate([
    (0, common_1.UseGuards)(auth_1.JwtAuthGuard),
    (0, common_1.Controller)('asistencia/debug'),
    __param(1, (0, typeorm_1.InjectRepository)(raw_log_entity_1.RawLogEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(fichaje_entity_1.FichajeEntity)),
    __metadata("design:paramtypes", [adms_service_1.AdmsService,
        typeorm_2.Repository,
        typeorm_2.Repository])
], DebugController);
//# sourceMappingURL=debug.controller.js.map