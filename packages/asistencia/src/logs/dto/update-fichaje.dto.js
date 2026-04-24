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
exports.UpdateFichajeDto = void 0;
const class_validator_1 = require("class-validator");
const fichaje_entity_1 = require("../../entities/fichaje.entity");
class UpdateFichajeDto {
}
exports.UpdateFichajeDto = UpdateFichajeDto;
__decorate([
    (0, class_validator_1.IsEnum)(fichaje_entity_1.EstadoFichaje),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateFichajeDto.prototype, "estado", void 0);
__decorate([
    (0, class_validator_1.IsISO8601)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateFichajeDto.prototype, "tiempo", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], UpdateFichajeDto.prototype, "empleadoId", void 0);
//# sourceMappingURL=update-fichaje.dto.js.map