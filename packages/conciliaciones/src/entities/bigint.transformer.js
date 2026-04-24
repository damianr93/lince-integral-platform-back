"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bigintTransformer = void 0;
exports.bigintTransformer = {
    to: (value) => value != null ? String(value) : null,
    from: (value) => value != null ? Number(value) : null,
};
//# sourceMappingURL=bigint.transformer.js.map