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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateSatisfactionDto = exports.Valoracion = exports.AnteInconvenientes = exports.Recomendacion = exports.ComoNosConocio = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
var ComoNosConocio;
(function (ComoNosConocio) {
    ComoNosConocio["VISITA_VENDEDOR"] = "VISITA_VENDEDOR";
    ComoNosConocio["RECOMENDACION_COLEGA"] = "RECOMENDACION_COLEGA";
    ComoNosConocio["VENDEDOR"] = "VENDEDOR";
    ComoNosConocio["WEB"] = "WEB";
    ComoNosConocio["EXPOSICIONES"] = "EXPOSICIONES";
})(ComoNosConocio || (exports.ComoNosConocio = ComoNosConocio = {}));
var Recomendacion;
(function (Recomendacion) {
    Recomendacion["SI"] = "SI";
    Recomendacion["NO"] = "NO";
    Recomendacion["MAYBE"] = "MAYBE";
})(Recomendacion || (exports.Recomendacion = Recomendacion = {}));
var AnteInconvenientes;
(function (AnteInconvenientes) {
    AnteInconvenientes["EXCELENTE"] = "EXCELENTE";
    AnteInconvenientes["BUENA"] = "BUENA";
    AnteInconvenientes["MALA"] = "MALA";
    AnteInconvenientes["N_A"] = "N_A";
})(AnteInconvenientes || (exports.AnteInconvenientes = AnteInconvenientes = {}));
var Valoracion;
(function (Valoracion) {
    Valoracion["CALIDAD"] = "CALIDAD";
    Valoracion["TIEMPO_ENTREGA"] = "TIEMPO_ENTREGA";
    Valoracion["ATENCION"] = "ATENCION";
    Valoracion["RESOLUCION_INCONVENIENTES"] = "RESOLUCION_INCONVENIENTES";
    Valoracion["SIN_VALORACION"] = "SIN_VALORACION";
})(Valoracion || (exports.Valoracion = Valoracion = {}));
class CreateSatisfactionDto {
}
exports.CreateSatisfactionDto = CreateSatisfactionDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '+54 9 351 555-1234', description: 'Teléfono del cliente' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(20),
    __metadata("design:type", String)
], CreateSatisfactionDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'PIPO Bovino 18%', description: 'Producto evaluado' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSatisfactionDto.prototype, "producto", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: ComoNosConocio,
        description: 'Cómo conoció al cliente',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(ComoNosConocio),
    __metadata("design:type", String)
], CreateSatisfactionDto.prototype, "comoNosConocio", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '¿Se compró el producto?',
        example: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateSatisfactionDto.prototype, "productoComprado", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'Bloque Magnesiado',
        description: 'Nombre específico del producto',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateSatisfactionDto.prototype, "nombreProducto", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 4,
        minimum: 1,
        maximum: 5,
        description: 'Calidad percibida (1-5)',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], CreateSatisfactionDto.prototype, "calidad", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 3,
        minimum: 1,
        maximum: 5,
        description: 'Tiempo de entrega/formación (1-5)',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], CreateSatisfactionDto.prototype, "tiempoForme", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 5,
        minimum: 1,
        maximum: 5,
        description: 'Atención recibida (1-5)',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], CreateSatisfactionDto.prototype, "atencion", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: Recomendacion,
        description: '¿Recomendaría el producto?',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(Recomendacion),
    __metadata("design:type", String)
], CreateSatisfactionDto.prototype, "recomendacion", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: AnteInconvenientes,
        description: 'Valoración ante inconvenientes',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(AnteInconvenientes),
    __metadata("design:type", String)
], CreateSatisfactionDto.prototype, "anteInconvenientes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: Valoracion,
        description: 'Aspecto más valorado por el cliente',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(Valoracion),
    __metadata("design:type", String)
], CreateSatisfactionDto.prototype, "valoracion", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'Muy conforme con el seguimiento postventa',
        maxLength: 300,
        description: 'Comentarios adicionales',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(300),
    __metadata("design:type", String)
], CreateSatisfactionDto.prototype, "comentarios", void 0);
//# sourceMappingURL=create-satisfaction.dto.js.map