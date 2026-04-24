import { Model } from 'mongoose';
import { Satisfaction } from './schemas/satisfaction.schema';
import { CreateSatisfactionDto } from './dto/create-satisfaction.dto';
import { UpdateSatisfactionDto } from './dto/update-satisfaction.dto';
export declare class SatisfactionService {
    private readonly satisfactionModel;
    constructor(satisfactionModel: Model<Satisfaction>);
    create(createSatisfactionDto: CreateSatisfactionDto): Promise<import("mongoose").Document<unknown, {}, Satisfaction, {}, {}> & Satisfaction & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }>;
    findAll(): Promise<Satisfaction[] | any[]>;
    findOne(id: string): Promise<Satisfaction | any>;
    update(id: string, updateSatisfactionDto: UpdateSatisfactionDto): Promise<Satisfaction | any>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
//# sourceMappingURL=satisfaction.service.d.ts.map