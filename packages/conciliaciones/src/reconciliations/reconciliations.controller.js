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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReconciliationsController = void 0;
const common_1 = require("@nestjs/common");
const auth_1 = require("@lince/auth");
const reconciliations_service_1 = require("./reconciliations.service");
const create_run_dto_1 = require("./dto/create-run.dto");
const update_system_dto_1 = require("./dto/update-system.dto");
const share_run_dto_1 = require("./dto/share-run.dto");
const message_dto_1 = require("./dto/message.dto");
const create_pending_dto_1 = require("./dto/create-pending.dto");
const notify_dto_1 = require("./dto/notify.dto");
const set_match_dto_1 = require("./dto/set-match.dto");
const add_excluded_concept_dto_1 = require("./dto/add-excluded-concept.dto");
const exclude_many_dto_1 = require("./dto/exclude-many.dto");
const exclude_by_category_dto_1 = require("./dto/exclude-by-category.dto");
const remove_excluded_concept_dto_1 = require("./dto/remove-excluded-concept.dto");
const create_issue_dto_1 = require("./dto/create-issue.dto");
const platform_express_1 = require("@nestjs/platform-express");
const parse_file_dto_1 = require("./dto/parse-file.dto");
let ReconciliationsController = class ReconciliationsController {
    constructor(service) {
        this.service = service;
    }
    create(dto, req) {
        return this.service.createRun(dto, req.user.id);
    }
    list() {
        return this.service.listRuns();
    }
    createIssue(id, dto, req) {
        return this.service.createIssue(id, req.user.id, { title: dto.title, body: dto.body });
    }
    updateIssue(id, issueId, dto, req) {
        return this.service.updateIssue(id, issueId, req.user.id, {
            title: dto.title,
            body: dto.body,
        });
    }
    addIssueComment(id, issueId, dto, req) {
        return this.service.addIssueComment(issueId, req.user.id, dto.body);
    }
    removeMember(id, userId, req) {
        return this.service.removeMember(id, req.user.id, userId);
    }
    async get(id) {
        const run = await this.service.getRun(id);
        if (!run)
            throw new common_1.NotFoundException('Run no encontrado');
        return run;
    }
    async updateSystem(id, dto, req) {
        await this.service.assertCanEdit(id, req.user.id);
        return this.service.updateSystemData(id, req.user.id, dto);
    }
    addExcludedConcept(id, dto, req) {
        return this.service.addExcludedConcept(id, req.user.id, dto.concept);
    }
    addExcludedConcepts(id, dto, req) {
        return this.service.addExcludedConcepts(id, req.user.id, dto.concepts);
    }
    addExcludedByCategory(id, dto, req) {
        return this.service.addExcludedByCategory(id, req.user.id, dto.categoryId);
    }
    removeExcludedConcept(id, dto, req) {
        return this.service.removeExcludedConcept(id, req.user.id, dto.concept);
    }
    async updateRun(id, body, req) {
        await this.service.assertCanEdit(id, req.user.id);
        return this.service.updateRun(id, req.user.id, body);
    }
    async deleteRun(id, req) {
        await this.service.deleteRun(id, req.user.id, req.user.globalRole === 'SUPERADMIN');
        return { deleted: true };
    }
    share(id, dto, req) {
        return this.service.shareRun(id, req.user.id, dto.email, dto.role);
    }
    addMessage(id, dto, req) {
        return this.service.addMessage(id, req.user.id, dto.body);
    }
    parseFile(file, dto) {
        return this.service.parseFile(file, dto.sheetName, dto.headerRow);
    }
    async export(id, req, res) {
        const buffer = await this.service.exportRun(id, req.user.id);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=conciliacion_${id}.xlsx`);
        res.send(buffer);
    }
    createPending(id, dto, req) {
        return this.service.createPending(id, req.user.id, dto);
    }
    resolvePending(id, pendingId, dto, req) {
        return this.service.resolvePending(id, req.user.id, pendingId, dto);
    }
    updatePendingStatus(id, pendingId, body, req) {
        return this.service.updatePendingStatus(id, req.user.id, pendingId, body.status);
    }
    setMatch(id, dto, req) {
        return this.service.setMatch(id, req.user.id, dto.systemLineId, dto.extractLineIds);
    }
    notifyPending(id, dto, req) {
        return this.service.notifyPending(id, req.user.id, dto);
    }
};
exports.ReconciliationsController = ReconciliationsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_run_dto_1.CreateRunDto, Object]),
    __metadata("design:returntype", void 0)
], ReconciliationsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ReconciliationsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(':id/issues'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_issue_dto_1.CreateIssueDto, Object]),
    __metadata("design:returntype", void 0)
], ReconciliationsController.prototype, "createIssue", null);
__decorate([
    (0, common_1.Patch)(':id/issues/:issueId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('issueId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, create_issue_dto_1.UpdateIssueDto, Object]),
    __metadata("design:returntype", void 0)
], ReconciliationsController.prototype, "updateIssue", null);
__decorate([
    (0, common_1.Post)(':id/issues/:issueId/comments'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('issueId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, create_issue_dto_1.CreateIssueCommentDto, Object]),
    __metadata("design:returntype", void 0)
], ReconciliationsController.prototype, "addIssueComment", null);
__decorate([
    (0, common_1.Delete)(':id/members/:userId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], ReconciliationsController.prototype, "removeMember", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReconciliationsController.prototype, "get", null);
__decorate([
    (0, common_1.Patch)(':id/system'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_system_dto_1.UpdateSystemDto, Object]),
    __metadata("design:returntype", Promise)
], ReconciliationsController.prototype, "updateSystem", null);
__decorate([
    (0, common_1.Patch)(':id/exclude-concept'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, add_excluded_concept_dto_1.AddExcludedConceptDto, Object]),
    __metadata("design:returntype", void 0)
], ReconciliationsController.prototype, "addExcludedConcept", null);
__decorate([
    (0, common_1.Patch)(':id/exclude-concepts'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, exclude_many_dto_1.ExcludeManyDto, Object]),
    __metadata("design:returntype", void 0)
], ReconciliationsController.prototype, "addExcludedConcepts", null);
__decorate([
    (0, common_1.Patch)(':id/exclude-by-category'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, exclude_by_category_dto_1.ExcludeByCategoryDto, Object]),
    __metadata("design:returntype", void 0)
], ReconciliationsController.prototype, "addExcludedByCategory", null);
__decorate([
    (0, common_1.Patch)(':id/remove-excluded-concept'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, remove_excluded_concept_dto_1.RemoveExcludedConceptDto, Object]),
    __metadata("design:returntype", void 0)
], ReconciliationsController.prototype, "removeExcludedConcept", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ReconciliationsController.prototype, "updateRun", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ReconciliationsController.prototype, "deleteRun", null);
__decorate([
    (0, common_1.Post)(':id/share'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, share_run_dto_1.ShareRunDto, Object]),
    __metadata("design:returntype", void 0)
], ReconciliationsController.prototype, "share", null);
__decorate([
    (0, common_1.Post)(':id/messages'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, message_dto_1.CreateMessageDto, Object]),
    __metadata("design:returntype", void 0)
], ReconciliationsController.prototype, "addMessage", null);
__decorate([
    (0, common_1.Post)('parse'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof Express !== "undefined" && (_a = Express.Multer) !== void 0 && _a.File) === "function" ? _b : Object, parse_file_dto_1.ParseFileDto]),
    __metadata("design:returntype", void 0)
], ReconciliationsController.prototype, "parseFile", null);
__decorate([
    (0, common_1.Get)(':id/export'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ReconciliationsController.prototype, "export", null);
__decorate([
    (0, common_1.Post)(':id/pending'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_pending_dto_1.CreatePendingDto, Object]),
    __metadata("design:returntype", void 0)
], ReconciliationsController.prototype, "createPending", null);
__decorate([
    (0, common_1.Patch)(':id/pending/:pendingId/resolve'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('pendingId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, create_pending_dto_1.ResolvePendingDto, Object]),
    __metadata("design:returntype", void 0)
], ReconciliationsController.prototype, "resolvePending", null);
__decorate([
    (0, common_1.Patch)(':id/pending/:pendingId/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('pendingId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", void 0)
], ReconciliationsController.prototype, "updatePendingStatus", null);
__decorate([
    (0, common_1.Post)(':id/match'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, set_match_dto_1.SetMatchDto, Object]),
    __metadata("design:returntype", void 0)
], ReconciliationsController.prototype, "setMatch", null);
__decorate([
    (0, common_1.Post)(':id/notify'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, notify_dto_1.NotifyDto, Object]),
    __metadata("design:returntype", void 0)
], ReconciliationsController.prototype, "notifyPending", null);
exports.ReconciliationsController = ReconciliationsController = __decorate([
    (0, common_1.Controller)('conciliaciones/reconciliations'),
    (0, common_1.UseGuards)(auth_1.JwtAuthGuard),
    __metadata("design:paramtypes", [reconciliations_service_1.ReconciliationsService])
], ReconciliationsController);
//# sourceMappingURL=reconciliations.controller.js.map