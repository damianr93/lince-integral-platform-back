import { Document, Schema, Types } from 'mongoose';
import { FollowUpDeliveryOption } from '../follow-up.rules';
import { CustomerStatus, FollowUpTaskStatus, FollowUpTemplateId } from '../follow-up.types';
export interface FollowUpTask extends Document {
    customerId: Types.ObjectId;
    executeAt: Date;
    triggerStatus: CustomerStatus;
    templateId: FollowUpTemplateId;
    delivery: FollowUpDeliveryOption[];
    status: FollowUpTaskStatus;
    attempts: number;
    selectedOptionIndex?: number;
    eventId?: Types.ObjectId;
    error?: string;
    processedAt?: Date;
    cancelledAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const FollowUpTaskSchema: Schema<FollowUpTask, import("mongoose").Model<FollowUpTask, any, any, any, Document<unknown, any, FollowUpTask, any, {}> & FollowUpTask & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, FollowUpTask, Document<unknown, {}, import("mongoose").FlatRecord<FollowUpTask>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<FollowUpTask> & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>;
//# sourceMappingURL=follow-up-task.schema.d.ts.map