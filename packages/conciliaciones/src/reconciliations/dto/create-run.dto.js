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
exports.CreateRunDto = exports.SystemDatasetDto = exports.DatasetDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const mapping_dto_1 = require("./mapping.dto");
class DatasetDto {
}
exports.DatasetDto = DatasetDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], DatasetDto.prototype, "rows", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => mapping_dto_1.ExtractMappingDto),
    __metadata("design:type", mapping_dto_1.ExtractMappingDto)
], DatasetDto.prototype, "mapping", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], DatasetDto.prototype, "excludeConcepts", void 0);
class SystemDatasetDto {
}
exports.SystemDatasetDto = SystemDatasetDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], SystemDatasetDto.prototype, "rows", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => mapping_dto_1.SystemMappingDto),
    __metadata("design:type", mapping_dto_1.SystemMappingDto)
], SystemDatasetDto.prototype, "mapping", void 0);
class CreateRunDto {
}
exports.CreateRunDto = CreateRunDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRunDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRunDto.prototype, "bankName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRunDto.prototype, "accountRef", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateRunDto.prototype, "windowDays", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRunDto.prototype, "cutDate", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => DatasetDto),
    __metadata("design:type", DatasetDto)
], CreateRunDto.prototype, "extract", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => SystemDatasetDto),
    __metadata("design:type", SystemDatasetDto)
], CreateRunDto.prototype, "system", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateRunDto.prototype, "enabledCategoryIds", void 0);
//# sourceMappingURL=create-run.dto.js.map