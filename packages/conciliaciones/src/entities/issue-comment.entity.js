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
exports.IssueCommentEntity = void 0;
const typeorm_1 = require("typeorm");
const issue_entity_1 = require("./issue.entity");
let IssueCommentEntity = class IssueCommentEntity {
};
exports.IssueCommentEntity = IssueCommentEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], IssueCommentEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], IssueCommentEntity.prototype, "issueId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => issue_entity_1.IssueEntity, (i) => i.comments, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'issueId' }),
    __metadata("design:type", issue_entity_1.IssueEntity)
], IssueCommentEntity.prototype, "issue", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], IssueCommentEntity.prototype, "authorId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], IssueCommentEntity.prototype, "body", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], IssueCommentEntity.prototype, "createdAt", void 0);
exports.IssueCommentEntity = IssueCommentEntity = __decorate([
    (0, typeorm_1.Entity)('recon_issue_comments')
], IssueCommentEntity);
//# sourceMappingURL=issue-comment.entity.js.map