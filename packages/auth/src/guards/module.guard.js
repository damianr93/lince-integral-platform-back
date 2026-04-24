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
exports.ModuleGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const types_1 = require("@lince/types");
const module_decorator_1 = require("../decorators/module.decorator");
let ModuleGuard = class ModuleGuard {
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(ctx) {
        const requiredModule = this.reflector.getAllAndOverride(module_decorator_1.MODULE_KEY, [ctx.getHandler(), ctx.getClass()]);
        if (!requiredModule)
            return true;
        const request = ctx.switchToHttp().getRequest();
        const user = request.user;
        if (!user)
            throw new common_1.ForbiddenException('Sin autenticación');
        // SUPERADMIN accede a todo
        if (user.globalRole === types_1.GlobalRole.SUPERADMIN)
            return true;
        if (user.area?.toUpperCase() === 'TAG') {
            if (requiredModule === types_1.ModuleKey.OCR)
                return true;
            throw new common_1.ForbiddenException('El perfil TAG solo puede acceder a OCR remitos');
        }
        if (requiredModule === types_1.ModuleKey.SOPORTE_IT)
            return true;
        const permission = user.modules[requiredModule];
        if (!permission?.enabled) {
            throw new common_1.ForbiddenException(`No tenés acceso al módulo: ${requiredModule}`);
        }
        return true;
    }
};
exports.ModuleGuard = ModuleGuard;
exports.ModuleGuard = ModuleGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], ModuleGuard);
//# sourceMappingURL=module.guard.js.map