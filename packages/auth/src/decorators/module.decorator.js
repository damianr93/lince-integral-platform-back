"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequireModule = exports.MODULE_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.MODULE_KEY = 'required_module';
const RequireModule = (module) => (0, common_1.SetMetadata)(exports.MODULE_KEY, module);
exports.RequireModule = RequireModule;
//# sourceMappingURL=module.decorator.js.map