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
exports.GeoController = void 0;
const common_1 = require("@nestjs/common");
const auth_1 = require("@lince/auth");
const types_1 = require("@lince/types");
const geo_service_1 = require("./geo.service");
let GeoController = class GeoController {
    constructor(geoService) {
        this.geoService = geoService;
    }
    async search(query, limit) {
        const trimmed = query?.trim();
        if (!trimmed || trimmed.length < 3) {
            throw new common_1.BadRequestException('La búsqueda debe tener al menos 3 caracteres');
        }
        const parsedLimit = limit ? Number(limit) : 6;
        return this.geoService.search(trimmed, Number.isFinite(parsedLimit) ? parsedLimit : 6);
    }
    async argentinaProvinces() {
        return this.geoService.argentinaProvincesGeoJson();
    }
};
exports.GeoController = GeoController;
__decorate([
    (0, common_1.Get)('search'),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], GeoController.prototype, "search", null);
__decorate([
    (0, common_1.Get)('argentina-provinces'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], GeoController.prototype, "argentinaProvinces", null);
exports.GeoController = GeoController = __decorate([
    (0, common_1.Controller)('crm/geo'),
    (0, common_1.UseGuards)(auth_1.JwtAuthGuard, auth_1.ModuleGuard),
    (0, auth_1.RequireModule)(types_1.ModuleKey.CRM),
    __metadata("design:paramtypes", [geo_service_1.GeoService])
], GeoController);
//# sourceMappingURL=geo.controller.js.map