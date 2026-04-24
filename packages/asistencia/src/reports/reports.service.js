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
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const fichaje_entity_1 = require("../entities/fichaje.entity");
const empleado_entity_1 = require("../entities/empleado.entity");
const logs_service_1 = require("../logs/logs.service");
let ReportsService = class ReportsService {
    constructor(logsService, empleadoRepo) {
        this.logsService = logsService;
        this.empleadoRepo = empleadoRepo;
    }
    // ── Quién está en planta ahora ─────────────────────────────────────────────
    async getPresentNow(planta) {
        const lastPunches = await this.logsService.getLastPunchesPerPin(planta);
        return lastPunches
            .filter((f) => f.estado === fichaje_entity_1.EstadoFichaje.ENTRADA)
            .map((f) => ({
            empleadoId: f.empleadoId,
            pin: f.pin,
            nombre: f.empleado ? `${f.empleado.firstName} ${f.empleado.lastName}` : `PIN ${f.pin}`,
            planta: f.planta,
            ultimaEntrada: f.tiempo,
        }));
    }
    // ── Resumen del día ────────────────────────────────────────────────────────
    async getDailySummary(planta) {
        const hoy = new Date();
        const fichajes = await this.logsService.findToday(planta);
        const empleados = await this.empleadoRepo.find({
            where: { activo: true, ...(planta ? { planta } : {}) },
        });
        // Agrupar fichajes por PIN
        const byPin = new Map();
        for (const f of fichajes) {
            if (!byPin.has(f.pin))
                byPin.set(f.pin, { entradas: [], salidas: [] });
            if (f.estado === fichaje_entity_1.EstadoFichaje.ENTRADA)
                byPin.get(f.pin).entradas.push(f);
            else
                byPin.get(f.pin).salidas.push(f);
        }
        const detalle = empleados.map((emp) => {
            const fichs = byPin.get(emp.pin);
            const primeraEntrada = fichs?.entradas.sort((a, b) => +a.tiempo - +b.tiempo)[0]?.tiempo ?? null;
            const ultimaSalida = fichs?.salidas.sort((a, b) => +b.tiempo - +a.tiempo)[0]?.tiempo ?? null;
            return {
                empleadoId: emp.id,
                pin: emp.pin,
                nombre: `${emp.firstName} ${emp.lastName}`,
                entrada: primeraEntrada,
                salida: ultimaSalida,
                completo: !!primeraEntrada && !!ultimaSalida,
            };
        });
        const presentes = detalle.filter((d) => d.entrada && !d.salida).length;
        return {
            fecha: hoy.toISOString().slice(0, 10),
            planta: planta ?? 'todas',
            entradas: fichajes.filter((f) => f.estado === fichaje_entity_1.EstadoFichaje.ENTRADA).length,
            salidas: fichajes.filter((f) => f.estado === fichaje_entity_1.EstadoFichaje.SALIDA).length,
            presentes,
            ausentes: empleados.length - detalle.filter((d) => d.entrada).length,
            detalle,
        };
    }
    // ── Historial de empleado ──────────────────────────────────────────────────
    async getEmployeeHistory(empleadoId, limit = 100) {
        return this.logsService.findByEmployee(empleadoId, limit);
    }
    // ── Fichajes con filtros (para tabla general) ──────────────────────────────
    async getAttendance(params) {
        return this.logsService.findAll({
            planta: params.planta,
            empleadoId: params.empleadoId,
            desde: params.desde ? new Date(params.desde) : undefined,
            hasta: params.hasta ? new Date(params.hasta) : undefined,
            estado: params.estado !== undefined ? Number(params.estado) : undefined,
            page: params.page ? Number(params.page) : undefined,
            limit: params.limit ? Number(params.limit) : undefined,
        });
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(empleado_entity_1.EmpleadoEntity)),
    __metadata("design:paramtypes", [logs_service_1.LogsService,
        typeorm_2.Repository])
], ReportsService);
//# sourceMappingURL=reports.service.js.map