import { Schema, Document, Types } from 'mongoose';
export type RecipientStatus = 'PENDING' | 'SENT' | 'FAILED' | 'SKIPPED';
export interface CampaignRecipient extends Document {
    campaignId: Types.ObjectId;
    customerId: Types.ObjectId;
    customerName?: string;
    customerPhone: string;
    siguiendo: string;
    phoneNumberId: string;
    status: RecipientStatus;
    yCloudMessageId?: string;
    skipReason?: string;
    errorMessage?: string;
    waveNumber?: number;
    attempts: number;
    retryAfter?: Date;
    sentAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const CampaignRecipientSchema: Schema<CampaignRecipient, import("mongoose").Model<CampaignRecipient, any, any, any, Document<unknown, any, CampaignRecipient, any, {}> & CampaignRecipient & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, CampaignRecipient, Document<unknown, {}, import("mongoose").FlatRecord<CampaignRecipient>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<CampaignRecipient> & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>;
//# sourceMappingURL=campaign-recipient.schema.d.ts.map