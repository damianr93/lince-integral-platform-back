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
exports.RunMemberEntity = void 0;
const typeorm_1 = require("typeorm");
const enums_1 = require("../enums");
const reconciliation_run_entity_1 = require("./reconciliation-run.entity");
let RunMemberEntity = class RunMemberEntity {
};
exports.RunMemberEntity = RunMemberEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], RunMemberEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], RunMemberEntity.prototype, "runId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => reconciliation_run_entity_1.ReconciliationRunEntity, (r) => r.members, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'runId' }),
    __metadata("design:type", reconciliation_run_entity_1.ReconciliationRunEntity)
], RunMemberEntity.prototype, "run", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], RunMemberEntity.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: enums_1.RunMemberRole, default: enums_1.RunMemberRole.EDITOR }),
    __metadata("design:type", String)
], RunMemberEntity.prototype, "role", void 0);
exports.RunMemberEntity = RunMemberEntity = __decorate([
    (0, typeorm_1.Entity)('run_members'),
    (0, typeorm_1.Unique)(['runId', 'userId'])
], RunMemberEntity);
//# sourceMappingURL=run-member.entity.js.map