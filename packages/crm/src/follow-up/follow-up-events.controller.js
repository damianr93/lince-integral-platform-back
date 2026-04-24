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
exports.FollowUpEventsController = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("mongoose");
const auth_1 = require("@lince/auth");
const types_1 = require("@lince/types");
const follow_up_events_service_1 = require("./follow-up-events.service");
const update_follow_up_event_status_dto_1 = require("./dto/update-follow-up-event-status.dto");
let FollowUpEventsController = class FollowUpEventsController {
    constructor(followUpEventsService) {
        this.followUpEventsService = followUpEventsService;
    }
    async updateStatus(id, dto) {
        const eventObjectId = new mongoose_1.Types.ObjectId(id);
        if (dto.status === 'COMPLETED') {
            return this.followUpEventsService.markEventCompleted(eventObjectId, new Date(), dto.notes);
        }
        if (dto.status === 'CANCELLED') {
            await this.followUpEventsService.markEventCancelled(eventObjectId, dto.notes);
            return this.followUpEventsService.findById(id);
        }
        if (dto.status === 'READY') {
            await this.followUpEventsService.upsertManualStatus(id, 'READY', dto.notes);
            return this.followUpEventsService.findById(id);
        }
        return this.followUpEventsService.findById(id);
    }
};
exports.FollowUpEventsController = FollowUpEventsController;
__decorate([
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_follow_up_event_status_dto_1.UpdateFollowUpEventStatusDto]),
    __metadata("design:returntype", Promise)
], FollowUpEventsController.prototype, "updateStatus", null);
exports.FollowUpEventsController = FollowUpEventsController = __decorate([
    (0, common_1.Controller)('crm/follow-up/events'),
    (0, common_1.UseGuards)(auth_1.JwtAuthGuard, auth_1.ModuleGuard),
    (0, auth_1.RequireModule)(types_1.ModuleKey.CRM),
    __metadata("design:paramtypes", [follow_up_events_service_1.FollowUpEventsService])
], FollowUpEventsController);
//# sourceMappingURL=follow-up-events.controller.js.map