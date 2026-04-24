import { SatisfactionService } from './satisfaction.service';
import { CreateSatisfactionDto } from './dto/create-satisfaction.dto';
import { UpdateSatisfactionDto } from './dto/update-satisfaction.dto';
export declare class SatisfactionController {
    private readonly satisfactionService;
    constructor(satisfactionService: SatisfactionService);
    create(createSatisfactionDto: CreateSatisfactionDto): Promise<import("mongoose").Document<unknown, {}, import("./schemas/satisfaction.schema").Satisfaction, {}, {}> & import("./schemas/satisfaction.schema").Satisfaction & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }>;
    findAll(): Promise<any[] | import("./schemas/satisfaction.schema").Satisfaction[]>;
    findOne(id: string): Promise<any>;
    update(id: string, updateSatisfactionDto: UpdateSatisfactionDto): Promise<any>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
//# sourceMappingURL=satisfaction.controller.d.ts.map