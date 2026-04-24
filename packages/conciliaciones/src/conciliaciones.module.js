"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConciliacionesModule = void 0;
const common_1 = require("@nestjs/common");
const reconciliations_module_1 = require("./reconciliations/reconciliations.module");
const expenses_module_1 = require("./expenses/expenses.module");
let ConciliacionesModule = class ConciliacionesModule {
};
exports.ConciliacionesModule = ConciliacionesModule;
exports.ConciliacionesModule = ConciliacionesModule = __decorate([
    (0, common_1.Module)({
        imports: [reconciliations_module_1.ReconciliationsModule, expenses_module_1.ExpensesModule],
        exports: [reconciliations_module_1.ReconciliationsModule, expenses_module_1.ExpensesModule],
    })
], ConciliacionesModule);
//# sourceMappingURL=conciliaciones.module.js.map