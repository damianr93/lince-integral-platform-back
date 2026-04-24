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
exports.RelevamientosService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const types_1 = require("@lince/types");
const relevamiento_entity_1 = require("../entities/relevamiento.entity");
const relevamiento_item_entity_1 = require("../entities/relevamiento-item.entity");
const incidentes_service_1 = require("../incidentes/incidentes.service");
let RelevamientosService = class RelevamientosService {
    constructor(relevamientos, items, incidentesService) {
        this.relevamientos = relevamientos;
        this.items = items;
        this.incidentesService = incidentesService;
    }
    async findOne(id) {
        const rel = await this.relevamientos.findOne({
            where: { id },
            relations: ['incidente', 'incidente.equipo', 'incidente.reportadoPor', 'creadoPor', 'items'],
            order: { items: { orden: 'ASC' } },
        });
        if (!rel)
            throw new common_1.NotFoundException(`Relevamiento ${id} no encontrado`);
        return rel;
    }
    async findByIncidente(incidenteId) {
        return this.relevamientos.findOne({
            where: { incidenteId },
            relations: ['incidente', 'incidente.equipo', 'incidente.reportadoPor', 'creadoPor', 'items'],
            order: { items: { orden: 'ASC' } },
        });
    }
    async assertCanReadIncidente(incidenteId, user) {
        if (user.globalRole === types_1.GlobalRole.SUPERADMIN)
            return;
        const incidente = await this.incidentesService.findOne(incidenteId);
        if (incidente.equipo?.usuarioPlatId !== user.id) {
            throw new common_1.ForbiddenException('No tenés acceso a este relevamiento');
        }
    }
    async findOneForUser(id, user) {
        const rel = await this.findOne(id);
        await this.assertCanReadIncidente(rel.incidenteId, user);
        return rel;
    }
    async findByIncidenteForUser(incidenteId, user) {
        await this.assertCanReadIncidente(incidenteId, user);
        return this.findByIncidente(incidenteId);
    }
    async create(dto, user) {
        // Verificar que el incidente existe
        await this.incidentesService.findOne(dto.incidenteId);
        // Solo puede haber un relevamiento por incidente
        const existing = await this.relevamientos.findOne({
            where: { incidenteId: dto.incidenteId },
        });
        if (existing) {
            throw new common_1.ConflictException('Ya existe un relevamiento para este incidente. Use PATCH para editarlo.');
        }
        const rel = this.relevamientos.create({
            incidenteId: dto.incidenteId,
            creadoPorId: user.id,
            fecha: dto.fecha ?? new Date().toISOString().slice(0, 10),
            modalidad: dto.modalidad ?? null,
            conclusionGeneral: dto.conclusionGeneral ?? null,
            pasosASeguir: dto.pasosASeguir ?? null,
            recomendaciones: dto.recomendaciones ?? null,
        });
        const saved = await this.relevamientos.save(rel);
        if (dto.items?.length) {
            const itemEntities = dto.items.map((item) => this.items.create({
                relevamientoId: saved.id,
                orden: item.orden,
                titulo: item.titulo,
                procedimiento: item.procedimiento ?? null,
                observacion: item.observacion ?? null,
                conclusion: item.conclusion ?? null,
            }));
            await this.items.save(itemEntities);
        }
        return this.findOne(saved.id);
    }
    async update(id, dto) {
        const rel = await this.findOne(id);
        Object.assign(rel, {
            ...(dto.fecha !== undefined && { fecha: dto.fecha }),
            ...(dto.modalidad !== undefined && { modalidad: dto.modalidad }),
            ...(dto.conclusionGeneral !== undefined && { conclusionGeneral: dto.conclusionGeneral }),
            ...(dto.pasosASeguir !== undefined && { pasosASeguir: dto.pasosASeguir }),
            ...(dto.recomendaciones !== undefined && { recomendaciones: dto.recomendaciones }),
        });
        await this.relevamientos.save(rel);
        if (dto.items !== undefined) {
            // Reemplazar todos los ítems
            await this.items.delete({ relevamientoId: id });
            if (dto.items.length) {
                const itemEntities = dto.items.map((item) => this.items.create({
                    relevamientoId: id,
                    orden: item.orden,
                    titulo: item.titulo,
                    procedimiento: item.procedimiento ?? null,
                    observacion: item.observacion ?? null,
                    conclusion: item.conclusion ?? null,
                }));
                await this.items.save(itemEntities);
            }
        }
        return this.findOne(id);
    }
};
exports.RelevamientosService = RelevamientosService;
exports.RelevamientosService = RelevamientosService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(relevamiento_entity_1.RelevamientoEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(relevamiento_item_entity_1.RelevamientoItemEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        incidentes_service_1.IncidentesService])
], RelevamientosService);
//# sourceMappingURL=relevamientos.service.js.map