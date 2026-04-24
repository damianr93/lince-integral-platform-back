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
exports.MarketingController = void 0;
const common_1 = require("@nestjs/common");
const auth_1 = require("@lince/auth");
const types_1 = require("@lince/types");
const marketing_service_1 = require("./marketing.service");
const ycloud_client_1 = require("./ycloud.client");
const create_campaign_dto_1 = require("./dto/create-campaign.dto");
const send_single_dto_1 = require("./dto/send-single.dto");
let MarketingController = class MarketingController {
    constructor(marketingService, ycloud) {
        this.marketingService = marketingService;
        this.ycloud = ycloud;
    }
    // ─── Templates ─────────────────────────────────────────────────────────────
    getTemplates() {
        return this.marketingService.getTemplates();
    }
    // ─── Envío puntual ─────────────────────────────────────────────────────────
    sendSingle(dto, user) {
        return this.marketingService.sendSingle(dto, user.id);
    }
    getDirectMessages() {
        return this.marketingService.getDirectMessages();
    }
    getFilterOptions() {
        return this.marketingService.getFilterOptions();
    }
    // ─── Campañas ───────────────────────────────────────────────────────────────
    findAll() {
        return this.marketingService.findAll();
    }
    previewByFilter(body) {
        return this.marketingService.previewByFilter(body);
    }
    findOne(id) {
        return this.marketingService.findById(id);
    }
    create(dto, user) {
        return this.marketingService.create(dto, user.id);
    }
    execute(id) {
        return this.marketingService.execute(id);
    }
    remove(id) {
        return this.marketingService.remove(id);
    }
    previewCampaign(id) {
        return this.marketingService.previewCampaign(id);
    }
    getRecipients(id) {
        return this.marketingService.getRecipients(id);
    }
    configureWaves(id, body) {
        return this.marketingService.configureWaves(id, body.waves.map((w) => ({ ...w, scheduledAt: new Date(w.scheduledAt) })));
    }
    async getWaves(id) {
        const campaign = await this.marketingService.findById(id);
        return campaign.waves ?? [];
    }
    reconfigureScheduledWaves(id, body) {
        return this.marketingService.reconfigureScheduledWaves(id, body.waves.map((w) => ({ scheduledAt: new Date(w.scheduledAt), recipientCount: w.recipientCount })));
    }
    rescheduleWave(id, waveNumber, body) {
        return this.marketingService.rescheduleWave(id, waveNumber, new Date(body.scheduledAt));
    }
    retryRecipient(id, recipientId) {
        return this.marketingService.retryRecipient(id, recipientId);
    }
    updateRecipientPhone(id, recipientId, body) {
        return this.marketingService.updateRecipientPhone(id, recipientId, body.phone);
    }
    getLogs(id) {
        return this.marketingService.getLogs(id);
    }
    // ─── Webhook (sin auth JWT — validado por firma HMAC) ──────────────────────
    async ycloudWebhook(req, signature, payload) {
        const rawBody = req.rawBody?.toString('utf-8') ?? JSON.stringify(payload);
        const valid = await this.ycloud.verifyWebhookSignature(rawBody, signature ?? '');
        if (!valid) {
            return { ok: false };
        }
        await this.marketingService.handleWebhook(payload);
        return { ok: true };
    }
};
exports.MarketingController = MarketingController;
__decorate([
    (0, common_1.Get)('templates'),
    (0, common_1.UseGuards)(auth_1.JwtAuthGuard, auth_1.ModuleGuard),
    (0, auth_1.RequireModule)(types_1.ModuleKey.MARKETING),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MarketingController.prototype, "getTemplates", null);
__decorate([
    (0, common_1.Post)('send-single'),
    (0, common_1.UseGuards)(auth_1.JwtAuthGuard, auth_1.ModuleGuard),
    (0, auth_1.RequireModule)(types_1.ModuleKey.MARKETING),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, auth_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [send_single_dto_1.SendSingleDto, Object]),
    __metadata("design:returntype", void 0)
], MarketingController.prototype, "sendSingle", null);
__decorate([
    (0, common_1.Get)('direct-messages'),
    (0, common_1.UseGuards)(auth_1.JwtAuthGuard, auth_1.ModuleGuard),
    (0, auth_1.RequireModule)(types_1.ModuleKey.MARKETING),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MarketingController.prototype, "getDirectMessages", null);
__decorate([
    (0, common_1.Get)('filter-options'),
    (0, common_1.UseGuards)(auth_1.JwtAuthGuard, auth_1.ModuleGuard),
    (0, auth_1.RequireModule)(types_1.ModuleKey.MARKETING),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MarketingController.prototype, "getFilterOptions", null);
__decorate([
    (0, common_1.Get)('campaigns'),
    (0, common_1.UseGuards)(auth_1.JwtAuthGuard, auth_1.ModuleGuard),
    (0, auth_1.RequireModule)(types_1.ModuleKey.MARKETING),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MarketingController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)('campaigns/preview'),
    (0, common_1.UseGuards)(auth_1.JwtAuthGuard, auth_1.ModuleGuard),
    (0, auth_1.RequireModule)(types_1.ModuleKey.MARKETING),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MarketingController.prototype, "previewByFilter", null);
__decorate([
    (0, common_1.Get)('campaigns/:id'),
    (0, common_1.UseGuards)(auth_1.JwtAuthGuard, auth_1.ModuleGuard),
    (0, auth_1.RequireModule)(types_1.ModuleKey.MARKETING),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MarketingController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)('campaigns'),
    (0, common_1.UseGuards)(auth_1.JwtAuthGuard, auth_1.ModuleGuard),
    (0, auth_1.RequireModule)(types_1.ModuleKey.MARKETING),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, auth_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_campaign_dto_1.CreateCampaignDto, Object]),
    __metadata("design:returntype", void 0)
], MarketingController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('campaigns/:id/execute'),
    (0, common_1.UseGuards)(auth_1.JwtAuthGuard, auth_1.ModuleGuard),
    (0, auth_1.RequireModule)(types_1.ModuleKey.MARKETING),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MarketingController.prototype, "execute", null);
__decorate([
    (0, common_1.Delete)('campaigns/:id'),
    (0, common_1.UseGuards)(auth_1.JwtAuthGuard, auth_1.ModuleGuard),
    (0, auth_1.RequireModule)(types_1.ModuleKey.MARKETING),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MarketingController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)('campaigns/:id/preview'),
    (0, common_1.UseGuards)(auth_1.JwtAuthGuard, auth_1.ModuleGuard),
    (0, auth_1.RequireModule)(types_1.ModuleKey.MARKETING),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MarketingController.prototype, "previewCampaign", null);
__decorate([
    (0, common_1.Get)('campaigns/:id/recipients'),
    (0, common_1.UseGuards)(auth_1.JwtAuthGuard, auth_1.ModuleGuard),
    (0, auth_1.RequireModule)(types_1.ModuleKey.MARKETING),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MarketingController.prototype, "getRecipients", null);
__decorate([
    (0, common_1.Post)('campaigns/:id/waves'),
    (0, common_1.UseGuards)(auth_1.JwtAuthGuard, auth_1.ModuleGuard),
    (0, auth_1.RequireModule)(types_1.ModuleKey.MARKETING),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MarketingController.prototype, "configureWaves", null);
__decorate([
    (0, common_1.Get)('campaigns/:id/waves'),
    (0, common_1.UseGuards)(auth_1.JwtAuthGuard, auth_1.ModuleGuard),
    (0, auth_1.RequireModule)(types_1.ModuleKey.MARKETING),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MarketingController.prototype, "getWaves", null);
__decorate([
    (0, common_1.Patch)('campaigns/:id/waves/reconfigure'),
    (0, common_1.UseGuards)(auth_1.JwtAuthGuard, auth_1.ModuleGuard),
    (0, auth_1.RequireModule)(types_1.ModuleKey.MARKETING),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MarketingController.prototype, "reconfigureScheduledWaves", null);
__decorate([
    (0, common_1.Patch)('campaigns/:id/waves/:waveNumber/reschedule'),
    (0, common_1.UseGuards)(auth_1.JwtAuthGuard, auth_1.ModuleGuard),
    (0, auth_1.RequireModule)(types_1.ModuleKey.MARKETING),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('waveNumber', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Object]),
    __metadata("design:returntype", void 0)
], MarketingController.prototype, "rescheduleWave", null);
__decorate([
    (0, common_1.Post)('campaigns/:id/recipients/:recipientId/retry'),
    (0, common_1.UseGuards)(auth_1.JwtAuthGuard, auth_1.ModuleGuard),
    (0, auth_1.RequireModule)(types_1.ModuleKey.MARKETING),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('recipientId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], MarketingController.prototype, "retryRecipient", null);
__decorate([
    (0, common_1.Patch)('campaigns/:id/recipients/:recipientId/phone'),
    (0, common_1.UseGuards)(auth_1.JwtAuthGuard, auth_1.ModuleGuard),
    (0, auth_1.RequireModule)(types_1.ModuleKey.MARKETING),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('recipientId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], MarketingController.prototype, "updateRecipientPhone", null);
__decorate([
    (0, common_1.Get)('campaigns/:id/logs'),
    (0, common_1.UseGuards)(auth_1.JwtAuthGuard, auth_1.ModuleGuard),
    (0, auth_1.RequireModule)(types_1.ModuleKey.MARKETING),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MarketingController.prototype, "getLogs", null);
__decorate([
    (0, common_1.Post)('webhooks/ycloud'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('ycloud-signature')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], MarketingController.prototype, "ycloudWebhook", null);
exports.MarketingController = MarketingController = __decorate([
    (0, common_1.Controller)('marketing'),
    __metadata("design:paramtypes", [marketing_service_1.MarketingService,
        ycloud_client_1.YCloudClient])
], MarketingController);
//# sourceMappingURL=marketing.controller.js.map