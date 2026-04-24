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
exports.AnalyticsController = exports.Public = exports.IS_PUBLIC_KEY = void 0;
const common_1 = require("@nestjs/common");
const auth_1 = require("@lince/auth");
const types_1 = require("@lince/types");
const analytics_service_1 = require("./analytics.service");
exports.IS_PUBLIC_KEY = 'IS_PUBLIC_KEY';
const Public = () => (0, common_1.SetMetadata)(exports.IS_PUBLIC_KEY, true);
exports.Public = Public;
let AnalyticsController = class AnalyticsController {
    constructor(analyticsService) {
        this.analyticsService = analyticsService;
    }
    totales(year) {
        return this.analyticsService.totales(this.parseYear(year));
    }
    evolution(year) {
        return this.analyticsService.evolution(this.parseYear(year));
    }
    yearlyComparison(years) {
        return this.analyticsService.yearlyComparison(this.parseYears(years));
    }
    demandOfProduct(year) {
        return this.analyticsService.demandOfProduct(this.parseYear(year));
    }
    purchaseStatus(year) {
        return this.analyticsService.purchaseStatus(this.parseYear(year));
    }
    followUpEvents(assignedTo, status) {
        return this.analyticsService.followUpEvents(assignedTo, status);
    }
    locationSummary(query) {
        return this.analyticsService.locationSummary(this.normalizeLocationFilters(query));
    }
    locationHeatmap(query) {
        return this.analyticsService.locationHeatmap(this.normalizeLocationFilters(query));
    }
    locationDebug(query) {
        return this.analyticsService.locationDebug(this.normalizeLocationFilters(query));
    }
    async locationMap(res, query) {
        const result = await this.analyticsService.locationMapImage(this.normalizeLocationFilters(query));
        if (!result) {
            return res.status(204).send();
        }
        res.setHeader('Content-Type', result.contentType);
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        res.setHeader('Cache-Control', 'no-store');
        return res.send(result.buffer);
    }
    async locationMapBase64(query) {
        const result = await this.analyticsService.locationMapImage(this.normalizeLocationFilters(query));
        if (!result) {
            return { data: null, contentType: null };
        }
        return { data: result.buffer.toString('base64'), contentType: result.contentType };
    }
    async locationReportPdf(res, query) {
        const buffer = await this.analyticsService.locationReportPdf(this.normalizeLocationFilters(query));
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="reporte_ubicacion.pdf"');
        res.send(buffer);
    }
    normalizeLocationFilters(query) {
        const parseList = (value) => {
            if (!value)
                return undefined;
            const parsed = value
                .split(',')
                .map((item) => item.trim())
                .filter((item) => item.length > 0);
            return parsed.length > 0 ? parsed : undefined;
        };
        return {
            year: this.parseYear(query.year),
            startDate: query.startDate,
            endDate: query.endDate,
            provincias: parseList(query.provincias),
            paises: parseList(query.paises),
            zonas: parseList(query.zonas),
        };
    }
    parseYear(value) {
        if (!value)
            return undefined;
        const parsed = Number(value);
        if (!Number.isInteger(parsed) || parsed < 2000 || parsed > 2100) {
            return undefined;
        }
        return parsed;
    }
    parseYears(value) {
        if (!value) {
            const currentYear = new Date().getFullYear();
            return [currentYear - 1, currentYear];
        }
        const years = value
            .split(',')
            .map((item) => this.parseYear(item.trim()))
            .filter((year) => year !== undefined);
        if (years.length === 0) {
            const currentYear = new Date().getFullYear();
            return [currentYear - 1, currentYear];
        }
        return Array.from(new Set(years)).sort((a, b) => a - b);
    }
};
exports.AnalyticsController = AnalyticsController;
__decorate([
    (0, common_1.Get)('totales'),
    __param(0, (0, common_1.Query)('year')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "totales", null);
__decorate([
    (0, common_1.Get)('evolucion'),
    __param(0, (0, common_1.Query)('year')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "evolution", null);
__decorate([
    (0, common_1.Get)('yearly-comparison'),
    __param(0, (0, common_1.Query)('years')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "yearlyComparison", null);
__decorate([
    (0, common_1.Get)('demand-of-product'),
    __param(0, (0, common_1.Query)('year')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "demandOfProduct", null);
__decorate([
    (0, common_1.Get)('status'),
    __param(0, (0, common_1.Query)('year')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "purchaseStatus", null);
__decorate([
    (0, common_1.Get)('follow-up-events'),
    __param(0, (0, common_1.Query)('assignedTo')),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "followUpEvents", null);
__decorate([
    (0, common_1.Get)('location-summary'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "locationSummary", null);
__decorate([
    (0, common_1.Get)('location-heatmap'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "locationHeatmap", null);
__decorate([
    (0, common_1.Get)('location-debug'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "locationDebug", null);
__decorate([
    (0, exports.Public)(),
    (0, common_1.Get)('location-map'),
    __param(0, (0, common_1.Res)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "locationMap", null);
__decorate([
    (0, exports.Public)(),
    (0, common_1.Get)('location-map-base64'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "locationMapBase64", null);
__decorate([
    (0, common_1.Get)('location-report/pdf'),
    __param(0, (0, common_1.Res)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "locationReportPdf", null);
exports.AnalyticsController = AnalyticsController = __decorate([
    (0, common_1.Controller)('crm/analytics'),
    (0, common_1.UseGuards)(auth_1.JwtAuthGuard, auth_1.ModuleGuard),
    (0, auth_1.RequireModule)(types_1.ModuleKey.CRM),
    __metadata("design:paramtypes", [analytics_service_1.AnalyticsService])
], AnalyticsController);
//# sourceMappingURL=analytics.controller.js.map