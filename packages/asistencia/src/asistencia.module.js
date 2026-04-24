"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsistenciaModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const empleado_entity_1 = require("./entities/empleado.entity");
const fichaje_entity_1 = require("./entities/fichaje.entity");
const raw_log_entity_1 = require("./entities/raw-log.entity");
const adms_controller_1 = require("./adms/adms.controller");
const adms_service_1 = require("./adms/adms.service");
const employees_controller_1 = require("./employees/employees.controller");
const employees_service_1 = require("./employees/employees.service");
const logs_service_1 = require("./logs/logs.service");
const logs_controller_1 = require("./logs/logs.controller");
const reports_controller_1 = require("./reports/reports.controller");
const reports_service_1 = require("./reports/reports.service");
const debug_controller_1 = require("./debug/debug.controller");
let AsistenciaModule = class AsistenciaModule {
};
exports.AsistenciaModule = AsistenciaModule;
exports.AsistenciaModule = AsistenciaModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([empleado_entity_1.EmpleadoEntity, fichaje_entity_1.FichajeEntity, raw_log_entity_1.RawLogEntity]),
        ],
        controllers: [
            adms_controller_1.AdmsController,
            employees_controller_1.EmployeesController,
            reports_controller_1.ReportsController,
            logs_controller_1.LogsController,
            debug_controller_1.DebugController,
        ],
        providers: [
            adms_service_1.AdmsService,
            employees_service_1.EmployeesService,
            logs_service_1.LogsService,
            reports_service_1.ReportsService,
        ],
        exports: [adms_service_1.AdmsService, employees_service_1.EmployeesService, logs_service_1.LogsService, reports_service_1.ReportsService],
    })
], AsistenciaModule);
//# sourceMappingURL=asistencia.module.js.map