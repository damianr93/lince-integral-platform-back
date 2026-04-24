import { Repository } from 'typeorm';
import { EmpleadoEntity, Planta } from '../entities/empleado.entity';
import { CreateEmpleadoDto } from './dto/create-empleado.dto';
import { UpdateEmpleadoDto } from './dto/update-empleado.dto';
export declare class EmployeesService {
    private readonly repo;
    constructor(repo: Repository<EmpleadoEntity>);
    findAll(planta?: Planta, soloActivos?: boolean): Promise<EmpleadoEntity[]>;
    findOne(id: string): Promise<EmpleadoEntity>;
    findByPin(pin: string): Promise<EmpleadoEntity | null>;
    create(dto: CreateEmpleadoDto): Promise<EmpleadoEntity>;
    update(id: string, dto: UpdateEmpleadoDto): Promise<EmpleadoEntity>;
    remove(id: string): Promise<void>;
}
//# sourceMappingURL=employees.service.d.ts.map