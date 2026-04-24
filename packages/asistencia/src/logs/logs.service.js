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
exports.LogsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const fichaje_entity_1 = require("../entities/fichaje.entity");
let LogsService = class LogsService {
    constructor(repo) {
        this.repo = repo;
    }
    async findAll(filter = {}) {
        const { planta, empleadoId, pin, desde, hasta, estado, page = 1, limit = 50 } = filter;
        const pageNum = Math.max(1, Number(page) || 1);
        const limitNum = Math.min(200, Math.max(1, Number(limit) || 50));
        const qb = this.repo
            .createQueryBuilder('f')
            .leftJoinAndSelect('f.empleado', 'e')
            .orderBy('f.tiempo', 'DESC');
        if (planta)
            qb.andWhere('f.planta = :planta', { planta });
        if (empleadoId)
            qb.andWhere('f.empleadoId = :empleadoId', { empleadoId });
        if (pin)
            qb.andWhere('f.pin = :pin', { pin });
        if (estado !== undefined)
            qb.andWhere('f.estado = :estado', { estado });
        if (desde && hasta) {
            qb.andWhere('f.tiempo BETWEEN :desde AND :hasta', { desde, hasta });
        }
        else if (desde) {
            qb.andWhere('f.tiempo >= :desde', { desde });
        }
        else if (hasta) {
            qb.andWhere('f.tiempo <= :hasta', { hasta });
        }
        const [items, total] = await qb
            .skip((pageNum - 1) * limitNum)
            .take(limitNum)
            .getManyAndCount();
        return { items, total };
    }
    async updateById(id, input) {
        const fichaje = await this.repo.findOne({ where: { id }, relations: ['empleado'] });
        if (!fichaje) {
            throw new common_1.NotFoundException('Fichaje no encontrado');
        }
        if (input.estado !== undefined)
            fichaje.estado = input.estado;
        if (input.tiempo !== undefined)
            fichaje.tiempo = input.tiempo;
        if (input.empleadoId !== undefined)
            fichaje.empleadoId = input.empleadoId;
        return this.repo.save(fichaje);
    }
    async findToday(planta) {
        const hoy = new Date();
        const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 0, 0, 0);
        const fin = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59);
        const qb = this.repo
            .createQueryBuilder('f')
            .leftJoinAndSelect('f.empleado', 'e')
            .where('f.tiempo BETWEEN :inicio AND :fin', { inicio, fin })
            .orderBy('f.tiempo', 'ASC');
        if (planta)
            qb.andWhere('f.planta = :planta', { planta });
        return qb.getMany();
    }
    async findByEmployee(empleadoId, limit = 100) {
        return this.repo.find({
            where: { empleadoId },
            order: { tiempo: 'DESC' },
            take: limit,
            relations: ['empleado'],
        });
    }
    /** Último fichaje de cada PIN hoy — para determinar quién está en planta */
    async getLastPunchesPerPin(planta) {
        const hoy = new Date();
        const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 0, 0, 0);
        const sub = this.repo
            .createQueryBuilder('f2')
            .select('MAX(f2.tiempo)', 'maxTime')
            .addSelect('f2.pin', 'pin')
            .where('f2.tiempo >= :inicio', { inicio })
            .groupBy('f2.pin');
        if (planta)
            sub.andWhere('f2.planta = :planta', { planta });
        const qb = this.repo
            .createQueryBuilder('f')
            .leftJoinAndSelect('f.empleado', 'e')
            .innerJoin(`(${sub.getQuery()})`, 'last', 'f.pin = last.pin AND f.tiempo = last."maxTime"')
            .setParameters(sub.getParameters());
        if (planta)
            qb.andWhere('f.planta = :planta', { planta });
        return qb.getMany();
    }
};
exports.LogsService = LogsService;
exports.LogsService = LogsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(fichaje_entity_1.FichajeEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], LogsService);
//# sourceMappingURL=logs.service.js.map