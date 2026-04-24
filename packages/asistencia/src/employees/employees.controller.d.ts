import { EmployeesService } from './employees.service';
import { CreateEmpleadoDto } from './dto/create-empleado.dto';
import { UpdateEmpleadoDto } from './dto/update-empleado.dto';
import { Planta } from '../entities/empleado.entity';
export declare class EmployeesController {
    private readonly service;
    constructor(service: EmployeesService);
    findAll(planta?: Planta, soloActivos?: string): Promise<import("../entities/empleado.entity").EmpleadoEntity[]>;
    findOne(id: string): Promise<import("../entities/empleado.entity").EmpleadoEntity>;
    create(dto: CreateEmpleadoDto): Promise<import("../entities/empleado.entity").EmpleadoEntity>;
    update(id: string, dto: UpdateEmpleadoDto): Promise<import("../entities/empleado.entity").EmpleadoEntity>;
    remove(id: string): Promise<void>;
}
//# sourceMappingURL=employees.controller.d.ts.map