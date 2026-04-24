"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateSatisfactionDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_satisfaction_dto_1 = require("./create-satisfaction.dto");
class UpdateSatisfactionDto extends (0, mapped_types_1.PartialType)(create_satisfaction_dto_1.CreateSatisfactionDto) {
}
exports.UpdateSatisfactionDto = UpdateSatisfactionDto;
//# sourceMappingURL=update-satisfaction.dto.js.map