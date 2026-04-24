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
exports.UnmatchedSystemEntity = void 0;
const typeorm_1 = require("typeorm");
const enums_1 = require("../enums");
const reconciliation_run_entity_1 = require("./reconciliation-run.entity");
const system_line_entity_1 = require("./system-line.entity");
let UnmatchedSystemEntity = class UnmatchedSystemEntity {
};
exports.UnmatchedSystemEntity = UnmatchedSystemEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], UnmatchedSystemEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], UnmatchedSystemEntity.prototype, "runId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => reconciliation_run_entity_1.ReconciliationRunEntity, (r) => r.unmatchedSystem, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'runId' }),
    __metadata("design:type", reconciliation_run_entity_1.ReconciliationRunEntity)
], UnmatchedSystemEntity.prototype, "run", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], UnmatchedSystemEntity.prototype, "systemLineId", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => system_line_entity_1.SystemLineEntity, (l) => l.unmatched, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'systemLineId' }),
    __metadata("design:type", system_line_entity_1.SystemLineEntity)
], UnmatchedSystemEntity.prototype, "systemLine", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: enums_1.UnmatchedSystemStatus }),
    __metadata("design:type", String)
], UnmatchedSystemEntity.prototype, "status", void 0);
exports.UnmatchedSystemEntity = UnmatchedSystemEntity = __decorate([
    (0, typeorm_1.Entity)('unmatched_systems')
], UnmatchedSystemEntity);
//# sourceMappingURL=unmatched-system.entity.js.map