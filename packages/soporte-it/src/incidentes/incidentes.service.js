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
exports.IncidentesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const types_1 = require("@lince/types");
const incidente_entity_1 = require("../entities/incidente.entity");
const equipos_service_1 = require("../equipos/equipos.service");
let IncidentesService = class IncidentesService {
    constructor(incidentes, equiposService) {
        this.incidentes = incidentes;
        this.equiposService = equiposService;
    }
    /** Todos los incidentes — solo superadmin */
    findAll() {
        return this.incidentes.find({
            relations: ['equipo', 'reportadoPor', 'relevamiento'],
            order: { createdAt: 'DESC' },
        });
    }
    /** Incidentes de los equipos asignados al usuario */
    async findByUsuario(userId) {
        return this.incidentes
            .createQueryBuilder('inc')
            .leftJoinAndSelect('inc.equipo', 'equipo')
            .leftJoinAndSelect('inc.reportadoPor', 'reportadoPor')
            .leftJoinAndSelect('inc.relevamiento', 'relevamiento')
            .where('equipo.usuarioPlatId = :userId', { userId })
            .orderBy('inc.createdAt', 'DESC')
            .getMany();
    }
    /** Incidentes de un equipo específico */
    findByEquipo(equipoId) {
        return this.incidentes.find({
            where: { equipoId },
            relations: ['reportadoPor', 'relevamiento'],
            order: { createdAt: 'DESC' },
        });
    }
    async findOne(id) {
        const inc = await this.incidentes.findOne({
            where: { id },
            relations: ['equipo', 'equipo.usuarioPlat', 'reportadoPor', 'relevamiento'],
        });
        if (!inc)
            throw new common_1.NotFoundException(`Incidente ${id} no encontrado`);
        return inc;
    }
    async create(dto, user) {
        const equipo = await this.equiposService.findOne(dto.equipoId);
        // Un usuario normal solo puede reportar sobre sus propios equipos
        if (user.globalRole !== types_1.GlobalRole.SUPERADMIN) {
            if (equipo.usuarioPlatId !== user.id) {
                throw new common_1.ForbiddenException('Solo podés reportar incidentes de tus propios equipos');
            }
        }
        const maxResult = await this.incidentes
            .createQueryBuilder('i')
            .select('MAX(i.numeroReporte)', 'max')
            .getRawOne();
        const numeroReporte = (maxResult?.max ?? 0) + 1;
        const inc = this.incidentes.create({
            equipoId: dto.equipoId,
            reportadoPorId: user.id,
            descripcion: dto.descripcion,
            urgencia: dto.urgencia ?? 'media',
            estado: 'pending',
            numeroReporte,
            fechaReporte: dto.fechaReporte ? new Date(dto.fechaReporte) : new Date(),
            aplicacionesAfectadas: dto.aplicacionesAfectadas ?? null,
            accionesPrevias: dto.accionesPrevias ?? null,
        });
        return this.incidentes.save(inc);
    }
    async update(id, dto, user) {
        if (user.globalRole !== types_1.GlobalRole.SUPERADMIN) {
            throw new common_1.ForbiddenException('Solo el superadmin puede actualizar el estado de incidentes');
        }
        const inc = await this.findOne(id);
        if (dto.estado)
            inc.estado = dto.estado;
        if (dto.reportadoPorId !== undefined)
            inc.reportadoPorId = dto.reportadoPorId;
        return this.incidentes.save(inc);
    }
    async remove(id, user) {
        if (user.globalRole !== types_1.GlobalRole.SUPERADMIN) {
            throw new common_1.ForbiddenException('Solo el superadmin puede eliminar incidentes');
        }
        const inc = await this.findOne(id);
        await this.incidentes.remove(inc);
    }
};
exports.IncidentesService = IncidentesService;
exports.IncidentesService = IncidentesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(incidente_entity_1.IncidenteEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        equipos_service_1.EquiposService])
], IncidentesService);
//# sourceMappingURL=incidentes.service.js.map