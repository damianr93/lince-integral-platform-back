"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReconciliationsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const platform_express_1 = require("@nestjs/platform-express");
const reconciliations_service_1 = require("./reconciliations.service");
const reconciliations_controller_1 = require("./reconciliations.controller");
const reconciliation_run_entity_1 = require("../entities/reconciliation-run.entity");
const extract_line_entity_1 = require("../entities/extract-line.entity");
const system_line_entity_1 = require("../entities/system-line.entity");
const match_entity_1 = require("../entities/match.entity");
const unmatched_extract_entity_1 = require("../entities/unmatched-extract.entity");
const unmatched_system_entity_1 = require("../entities/unmatched-system.entity");
const run_member_entity_1 = require("../entities/run-member.entity");
const message_entity_1 = require("../entities/message.entity");
const issue_entity_1 = require("../entities/issue.entity");
const issue_comment_entity_1 = require("../entities/issue-comment.entity");
const pending_item_entity_1 = require("../entities/pending-item.entity");
const expense_category_entity_1 = require("../entities/expense-category.entity");
const database_1 = require("@lince/database");
let ReconciliationsModule = class ReconciliationsModule {
};
exports.ReconciliationsModule = ReconciliationsModule;
exports.ReconciliationsModule = ReconciliationsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                reconciliation_run_entity_1.ReconciliationRunEntity,
                extract_line_entity_1.ExtractLineEntity,
                system_line_entity_1.SystemLineEntity,
                match_entity_1.MatchEntity,
                unmatched_extract_entity_1.UnmatchedExtractEntity,
                unmatched_system_entity_1.UnmatchedSystemEntity,
                run_member_entity_1.RunMemberEntity,
                message_entity_1.MessageEntity,
                issue_entity_1.IssueEntity,
                issue_comment_entity_1.IssueCommentEntity,
                pending_item_entity_1.PendingItemEntity,
                expense_category_entity_1.ExpenseCategoryEntity,
                database_1.UserEntity,
            ]),
            platform_express_1.MulterModule.register({ storage: undefined }),
        ],
        controllers: [reconciliations_controller_1.ReconciliationsController],
        providers: [reconciliations_service_1.ReconciliationsService],
    })
], ReconciliationsModule);
//# sourceMappingURL=reconciliations.module.js.map