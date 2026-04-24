import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
export declare class WebhooksController {
    private readonly customersService;
    constructor(customersService: CustomersService);
    createFromManychat(dto: CreateCustomerDto): Promise<import("mongoose").Document<unknown, {}, import("./schemas/customer.schema").Customer, {}, {}> & import("./schemas/customer.schema").Customer & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    createFromWebchat(dto: CreateCustomerDto): Promise<import("mongoose").Document<unknown, {}, import("./schemas/customer.schema").Customer, {}, {}> & import("./schemas/customer.schema").Customer & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
}
//# sourceMappingURL=webhooks.controller.d.ts.map