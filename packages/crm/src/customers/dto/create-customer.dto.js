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
exports.CreateCustomerDto = exports.UbicacionDto = exports.Actividad = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const product_sanitizer_util_1 = require("../utils/product-sanitizer.util");
var Actividad;
(function (Actividad) {
    Actividad["CRIA"] = "CRIA";
    Actividad["RECRIA"] = "RECRIA";
    Actividad["MIXTO"] = "MIXTO";
    Actividad["DISTRIBUIDOR"] = "DISTRIBUIDOR";
})(Actividad || (exports.Actividad = Actividad = {}));
class UbicacionDto {
}
exports.UbicacionDto = UbicacionDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(({ value }) => value === null || value === undefined ? undefined : String(value)),
    __metadata("design:type", String)
], UbicacionDto.prototype, "pais", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(({ value }) => value === null || value === undefined ? undefined : String(value)),
    __metadata("design:type", String)
], UbicacionDto.prototype, "provincia", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(({ value }) => value === null || value === undefined ? undefined : String(value)),
    __metadata("design:type", String)
], UbicacionDto.prototype, "localidad", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(({ value }) => value === null || value === undefined ? undefined : String(value)),
    __metadata("design:type", String)
], UbicacionDto.prototype, "zona", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], UbicacionDto.prototype, "lat", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], UbicacionDto.prototype, "lon", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(({ value }) => value === null || value === undefined ? undefined : String(value)),
    __metadata("design:type", String)
], UbicacionDto.prototype, "displayName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(({ value }) => value === null || value === undefined ? undefined : String(value)),
    __metadata("design:type", String)
], UbicacionDto.prototype, "fuente", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UbicacionDto.prototype, "esNormalizada", void 0);
class CreateCustomerDto {
}
exports.CreateCustomerDto = CreateCustomerDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Juan', description: 'Nombre del cliente' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    (0, class_transformer_1.Transform)(({ value }) => value === null || value === undefined ? undefined : String(value)),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "nombre", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Pérez', description: 'Apellido del cliente' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    (0, class_transformer_1.Transform)(({ value }) => value === null || value === undefined ? undefined : String(value)),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "apellido", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '+54 9 351 555-1234',
        description: 'Teléfono de contacto',
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(20),
    (0, class_transformer_1.Transform)(({ value }) => value === null || value === undefined ? undefined : String(value)),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "telefono", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'juan@example.com',
        description: 'Correo electrónico',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    (0, class_transformer_1.Transform)(({ value }) => value === null || value === undefined ? undefined : String(value)),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "correo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 120,
        minimum: 0,
        description: 'Cantidad de cabezas de ganado (se almacena como string)',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(({ value }) => value === null || value === undefined ? undefined : String(value)),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "cabezas", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 6,
        minimum: 0,
        description: 'Meses que va a suplementar (se almacena como string)',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(({ value }) => value === null || value === undefined ? undefined : String(value)),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "mesesSuplemento", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'PIPO Bovino 18%',
        description: 'Producto consultado/comprado',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(({ value }) => (0, product_sanitizer_util_1.sanitizeProductName)(value)),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "producto", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Córdoba', description: 'Localidad del cliente' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(({ value }) => value === null || value === undefined ? undefined : String(value)),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "localidad", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Córdoba', description: 'Provincia del cliente' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(({ value }) => value === null || value === undefined ? undefined : String(value)),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "provincia", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Ubicación normalizada (pais, provincia, localidad, zona, coordenadas)',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => UbicacionDto),
    __metadata("design:type", UbicacionDto)
], CreateCustomerDto.prototype, "ubicacion", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: Actividad, description: 'Actividad principal' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(Actividad),
    (0, class_transformer_1.Transform)(({ value }) => typeof value === 'string' ? value.toUpperCase() : value),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "actividad", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'Prefiere entrega los lunes por la mañana',
        description: 'Observaciones adicionales',
        maxLength: 300,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(300),
    (0, class_transformer_1.Transform)(({ value }) => value === null || value === undefined ? undefined : String(value)),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "observaciones", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: ['EZEQUIEL', 'DENIS', 'MARTIN', 'SIN_ASIGNAR'],
        default: 'SIN_ASIGNAR',
        description: 'Quién está siguiendo al cliente',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(({ value }) => typeof value === 'string' ? value.toUpperCase() : value),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "siguiendo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: ['INSTAGRAM', 'WEB', 'WHATSAPP', 'FACEBOOK', 'OTRO'],
        default: 'OTRO',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(({ value }) => typeof value === 'string' ? value.toUpperCase() : value),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "medioAdquisicion", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: ['COMPRO', 'NO_COMPRO', 'PENDIENTE'],
        default: 'PENDIENTE',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(({ value }) => typeof value === 'string' ? value.toUpperCase() : value),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "estado", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(300),
    (0, class_transformer_1.Transform)(({ value }) => value === null || value === undefined ? undefined : String(value)),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Marca si el registro es una reconsulta detectada automáticamente',
        default: false,
        readOnly: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateCustomerDto.prototype, "isReconsulta", void 0);
//# sourceMappingURL=create-customer.dto.js.map