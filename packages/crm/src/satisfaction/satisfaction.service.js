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
exports.SatisfactionService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let SatisfactionService = class SatisfactionService {
    constructor(satisfactionModel) {
        this.satisfactionModel = satisfactionModel;
    }
    async create(createSatisfactionDto) {
        try {
            const createdSatisfaction = await this.satisfactionModel.create(createSatisfactionDto);
            if (!createdSatisfaction) {
                throw new common_1.BadRequestException('Error al cargar la respuesta de satisfacción');
            }
            return createdSatisfaction;
        }
        catch (error) {
            throw new common_1.InternalServerErrorException('Error al cargar la respuesta de satisfacción');
        }
    }
    // TODO-7 [DIFÍCIL]: Este servicio tiene bugs serios en el manejo de errores.
    //
    // Hay DOS problemas distintos que tenés que identificar y corregir:
    //
    // PROBLEMA A — findAll():
    //   El try/catch envuelve TODO el método. Si adentro se lanza un
    //   NotFoundException (lista vacía) o un BadRequestException, el catch
    //   los atrapa y los convierte en InternalServerErrorException.
    //   Resultado: "no hay registros" se reporta como error 500 del servidor,
    //   que es mentira — el servidor funcionó bien, simplemente no hay datos.
    //   Además, una lista vacía [] es una respuesta válida, no un error.
    //   Pregunta clave: ¿cuándo debería este método tirar error, y cuándo
    //   simplemente devolver un array vacío?
    //
    // PROBLEMA B — findOne():
    //   Mismo patrón: si findById() no encuentra el documento y lanzás
    //   NotFoundException dentro del try, el catch lo convierte en 500.
    //   El cliente nunca recibe un 404 real.
    //
    // Tu tarea: refactorizá ambos métodos para que:
    //   - Los errores reales del servidor (fallo de DB) se reporten como 500.
    //   - "No encontrado" se reporte como 404.
    //   - Una lista vacía devuelva [] sin tirar ningún error.
    //   - El tipo de retorno no use `any` — usá el tipo correcto.
    //
    // Pista: en lugar de un try/catch que envuelve todo, pensá en cuándo
    // necesitás realmente el catch y qué hacer dentro de él.
    async findAll() {
        try {
            const satisfactions = await this.satisfactionModel.find().lean().sort({ createdAt: -1 });
            if (!satisfactions) {
                throw new common_1.BadRequestException('Error al obtener las respuestas de satisfacción');
            }
            if (satisfactions.length === 0) {
                throw new common_1.NotFoundException('No se encontraron respuestas de satisfacción');
            }
            return satisfactions;
        }
        catch (error) {
            throw new common_1.InternalServerErrorException('Error al obtener las respuestas de satisfacción');
        }
    }
    async findOne(id) {
        try {
            const satisfaction = await this.satisfactionModel.findById(id).lean();
            if (!satisfaction)
                throw new common_1.NotFoundException('Respuesta de satisfacción no encontrada');
            return satisfaction;
        }
        catch (error) {
            throw new common_1.InternalServerErrorException('Error al obtener la respuesta de satisfacción');
        }
    }
    async update(id, updateSatisfactionDto) {
        try {
            const updatedSatisfaction = await this.satisfactionModel
                .findByIdAndUpdate(id, updateSatisfactionDto, { new: true })
                .lean();
            if (!updatedSatisfaction) {
                throw new common_1.NotFoundException('Respuesta de satisfacción no encontrada');
            }
            return updatedSatisfaction;
        }
        catch (error) {
            throw new common_1.InternalServerErrorException('Error al actualizar la respuesta de satisfacción');
        }
    }
    async remove(id) {
        try {
            const deletedSatisfaction = await this.satisfactionModel.findByIdAndDelete(id);
            if (!deletedSatisfaction) {
                throw new common_1.NotFoundException('Respuesta de satisfacción no encontrada');
            }
            return { message: 'Respuesta de satisfacción eliminada correctamente' };
        }
        catch (error) {
            throw new common_1.InternalServerErrorException('Error al eliminar la respuesta de satisfacción');
        }
    }
};
exports.SatisfactionService = SatisfactionService;
exports.SatisfactionService = SatisfactionService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)('Satisfaction')),
    __metadata("design:paramtypes", [mongoose_2.Model])
], SatisfactionService);
//# sourceMappingURL=satisfaction.service.js.map