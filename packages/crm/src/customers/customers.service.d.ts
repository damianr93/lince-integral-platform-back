import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { Response } from 'express';
import { Customer } from './schemas/customer.schema';
import { CustomerFollowUpService } from '../follow-up/customer-follow-up.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
export declare class CustomersService {
    private readonly clientModel;
    private readonly followUpService;
    private readonly config;
    private readonly logger;
    constructor(clientModel: Model<Customer>, followUpService: CustomerFollowUpService, config: ConfigService);
    create(dto: CreateCustomerDto): Promise<import("mongoose").Document<unknown, {}, Customer, {}, {}> & Customer & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    findAll(): Promise<(import("mongoose").FlattenMaps<Customer> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    findOne(id: string): Promise<import("mongoose").FlattenMaps<Customer> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    update(id: string, dto: UpdateCustomerDto): Promise<import("mongoose").FlattenMaps<Customer> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    remove(id: string): Promise<{
        message: string;
        id: string;
    }>;
    /**
     * Normaliza números de teléfono argentinos
     */
    private normalizeArgentinePhone;
    /**
     * Limpia datos del CRM removiendo placeholders y valores inválidos
     */
    private cleanCrmData;
    /**
     * Valida los datos del cliente
     */
    private validateClientData;
    private scheduleFollowUpSafely;
    generateExcel(res: Response): Promise<void>;
}
//# sourceMappingURL=customers.service.d.ts.map