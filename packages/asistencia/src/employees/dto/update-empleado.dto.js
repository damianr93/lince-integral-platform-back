"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateEmpleadoDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_empleado_dto_1 = require("./create-empleado.dto");
class UpdateEmpleadoDto extends (0, mapped_types_1.PartialType)(create_empleado_dto_1.CreateEmpleadoDto) {
}
exports.UpdateEmpleadoDto = UpdateEmpleadoDto;
//# sourceMappingURL=update-empleado.dto.js.map