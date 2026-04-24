import { Document, Schema, Types } from 'mongoose';
import { CustomerStatus, FollowUpTemplateId, MessageChannelType } from '../follow-up.types';
export type FollowUpEventStatus = 'SCHEDULED' | 'READY' | 'COMPLETED' | 'CANCELLED';
export interface FollowUpEvent extends Document {
    customerId: Types.ObjectId;
    customerName?: string;
    customerLastName?: string;
    customerPhone?: string;
    customerEmail?: string;
    assignedTo?: string;
    product?: string;
    triggerStatus: CustomerStatus;
    templateId: FollowUpTemplateId;
    message: string;
    channels: MessageChannelType[];
    contactValue?: string | null;
    scheduledFor: Date;
    readyAt?: Date;
    completedAt?: Date;
    cancelledAt?: Date;
    status: FollowUpEventStatus;
    notes?: string;
    followUpTaskId?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export declare const FollowUpEventSchema: Schema<FollowUpEvent, import("mongoose").Model<FollowUpEvent, any, any, any, Document<unknown, any, FollowUpEvent, any, {}> & FollowUpEvent & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, FollowUpEvent, Document<unknown, {}, import("mongoose").FlatRecord<FollowUpEvent>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<FollowUpEvent> & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>;
//# sourceMappingURL=follow-up-event.schema.d.ts.map