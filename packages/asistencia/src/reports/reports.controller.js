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
exports.ReportsController = void 0;
const common_1 = require("@nestjs/common");
const auth_1 = require("@lince/auth");
const reports_service_1 = require("./reports.service");
const empleado_entity_1 = require("../entities/empleado.entity");
let ReportsController = class ReportsController {
    constructor(service) {
        this.service = service;
    }
    /** GET /api/asistencia/reports/present-now?planta=tucuman */
    getPresentNow(planta) {
        return this.service.getPresentNow(planta);
    }
    /** GET /api/asistencia/reports/daily-summary?planta=villa_nueva */
    getDailySummary(planta) {
        return this.service.getDailySummary(planta);
    }
    /** GET /api/asistencia/reports/attendance?planta=tucuman&desde=2025-01-01&hasta=2025-01-31 */
    getAttendance(planta, empleadoId, desde, hasta, estado, page, limit) {
        return this.service.getAttendance({ planta, empleadoId, desde, hasta, estado, page, limit });
    }
    /** GET /api/asistencia/reports/employee/:id/history */
    getEmployeeHistory(id, limit) {
        return this.service.getEmployeeHistory(id, limit);
    }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, common_1.Get)('present-now'),
    __param(0, (0, common_1.Query)('planta')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getPresentNow", null);
__decorate([
    (0, common_1.Get)('daily-summary'),
    __param(0, (0, common_1.Query)('planta')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getDailySummary", null);
__decorate([
    (0, common_1.Get)('attendance'),
    __param(0, (0, common_1.Query)('planta')),
    __param(1, (0, common_1.Query)('empleadoId')),
    __param(2, (0, common_1.Query)('desde')),
    __param(3, (0, common_1.Query)('hasta')),
    __param(4, (0, common_1.Query)('estado')),
    __param(5, (0, common_1.Query)('page')),
    __param(6, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getAttendance", null);
__decorate([
    (0, common_1.Get)('employee/:id/history'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getEmployeeHistory", null);
exports.ReportsController = ReportsController = __decorate([
    (0, common_1.UseGuards)(auth_1.JwtAuthGuard),
    (0, common_1.Controller)('asistencia/reports'),
    __metadata("design:paramtypes", [reports_service_1.ReportsService])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map