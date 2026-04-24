import { Response } from 'express';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
export declare class CustomersController {
    private readonly customersService;
    constructor(customersService: CustomersService);
    create(dto: CreateCustomerDto): Promise<import("mongoose").Document<unknown, {}, import("./schemas/customer.schema").Customer, {}, {}> & import("./schemas/customer.schema").Customer & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    findAll(): Promise<(import("mongoose").FlattenMaps<import("./schemas/customer.schema").Customer> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    downloadExcel(res: Response): Promise<void>;
    findOne(id: string): Promise<import("mongoose").FlattenMaps<import("./schemas/customer.schema").Customer> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    update(id: string, dto: UpdateCustomerDto): Promise<import("mongoose").FlattenMaps<import("./schemas/customer.schema").Customer> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    remove(id: string): Promise<{
        message: string;
        id: string;
    }>;
}
//# sourceMappingURL=customers.controller.d.ts.map