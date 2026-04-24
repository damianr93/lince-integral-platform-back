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
exports.MatchEntity = void 0;
const typeorm_1 = require("typeorm");
const reconciliation_run_entity_1 = require("./reconciliation-run.entity");
const extract_line_entity_1 = require("./extract-line.entity");
const system_line_entity_1 = require("./system-line.entity");
let MatchEntity = class MatchEntity {
};
exports.MatchEntity = MatchEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], MatchEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], MatchEntity.prototype, "runId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => reconciliation_run_entity_1.ReconciliationRunEntity, (r) => r.matches, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'runId' }),
    __metadata("design:type", reconciliation_run_entity_1.ReconciliationRunEntity)
], MatchEntity.prototype, "run", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], MatchEntity.prototype, "extractLineId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => extract_line_entity_1.ExtractLineEntity, (l) => l.matchLines, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'extractLineId' }),
    __metadata("design:type", extract_line_entity_1.ExtractLineEntity)
], MatchEntity.prototype, "extractLine", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], MatchEntity.prototype, "systemLineId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => system_line_entity_1.SystemLineEntity, (l) => l.matchLines, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'systemLineId' }),
    __metadata("design:type", system_line_entity_1.SystemLineEntity)
], MatchEntity.prototype, "systemLine", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], MatchEntity.prototype, "deltaDays", void 0);
exports.MatchEntity = MatchEntity = __decorate([
    (0, typeorm_1.Entity)('matches')
], MatchEntity);
//# sourceMappingURL=match.entity.js.map