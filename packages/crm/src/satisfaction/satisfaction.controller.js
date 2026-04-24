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
exports.SatisfactionController = void 0;
const common_1 = require("@nestjs/common");
const auth_1 = require("@lince/auth");
const types_1 = require("@lince/types");
const satisfaction_service_1 = require("./satisfaction.service");
const create_satisfaction_dto_1 = require("./dto/create-satisfaction.dto");
const update_satisfaction_dto_1 = require("./dto/update-satisfaction.dto");
let SatisfactionController = class SatisfactionController {
    constructor(satisfactionService) {
        this.satisfactionService = satisfactionService;
    }
    create(createSatisfactionDto) {
        return this.satisfactionService.create(createSatisfactionDto);
    }
    findAll() {
        return this.satisfactionService.findAll();
    }
    findOne(id) {
        return this.satisfactionService.findOne(id);
    }
    update(id, updateSatisfactionDto) {
        return this.satisfactionService.update(id, updateSatisfactionDto);
    }
    remove(id) {
        return this.satisfactionService.remove(id);
    }
};
exports.SatisfactionController = SatisfactionController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_satisfaction_dto_1.CreateSatisfactionDto]),
    __metadata("design:returntype", void 0)
], SatisfactionController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SatisfactionController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SatisfactionController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_satisfaction_dto_1.UpdateSatisfactionDto]),
    __metadata("design:returntype", void 0)
], SatisfactionController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SatisfactionController.prototype, "remove", null);
exports.SatisfactionController = SatisfactionController = __decorate([
    (0, common_1.Controller)('crm/satisfaction'),
    (0, common_1.UseGuards)(auth_1.JwtAuthGuard, auth_1.ModuleGuard),
    (0, auth_1.RequireModule)(types_1.ModuleKey.CRM),
    __metadata("design:paramtypes", [satisfaction_service_1.SatisfactionService])
], SatisfactionController);
//# sourceMappingURL=satisfaction.controller.js.map