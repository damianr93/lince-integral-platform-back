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
exports.EmployeesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const empleado_entity_1 = require("../entities/empleado.entity");
let EmployeesService = class EmployeesService {
    constructor(repo) {
        this.repo = repo;
    }
    async findAll(planta, soloActivos = false) {
        const qb = this.repo.createQueryBuilder('e').orderBy('e.lastName').addOrderBy('e.firstName');
        if (planta)
            qb.andWhere('e.planta = :planta', { planta });
        if (soloActivos)
            qb.andWhere('e.activo = true');
        return qb.getMany();
    }
    async findOne(id) {
        const emp = await this.repo.findOne({ where: { id } });
        if (!emp)
            throw new common_1.NotFoundException(`Empleado ${id} no encontrado`);
        return emp;
    }
    async findByPin(pin) {
        return this.repo.findOne({ where: { pin } });
    }
    async create(dto) {
        const existing = await this.repo.findOne({ where: { pin: dto.pin } });
        if (existing)
            throw new common_1.ConflictException(`El PIN ${dto.pin} ya está asignado a otro empleado`);
        return this.repo.save(this.repo.create({ ...dto, activo: dto.activo ?? true }));
    }
    async update(id, dto) {
        const emp = await this.findOne(id);
        if (dto.pin && dto.pin !== emp.pin) {
            const conflict = await this.repo.findOne({ where: { pin: dto.pin } });
            if (conflict)
                throw new common_1.ConflictException(`El PIN ${dto.pin} ya está asignado a otro empleado`);
        }
        Object.assign(emp, dto);
        return this.repo.save(emp);
    }
    async remove(id) {
        const emp = await this.findOne(id);
        await this.repo.remove(emp);
    }
};
exports.EmployeesService = EmployeesService;
exports.EmployeesService = EmployeesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(empleado_entity_1.EmpleadoEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], EmployeesService);
//# sourceMappingURL=employees.service.js.map