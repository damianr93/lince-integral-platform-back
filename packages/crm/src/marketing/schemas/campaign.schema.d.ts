import { Schema, Document, Types } from 'mongoose';
export type CampaignStatus = 'DRAFT' | 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
export type WaveStatus = 'SCHEDULED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
export interface CampaignWave {
    waveNumber: number;
    scheduledAt: Date;
    recipientCount: number;
    status: WaveStatus;
    sentCount: number;
    failedCount: number;
    startedAt?: Date;
    completedAt?: Date;
}
export interface Campaign extends Document {
    name: string;
    templateName: string;
    templateLanguage: string;
    templateHeaderImageUrl?: string;
    waves?: CampaignWave[];
    status: CampaignStatus;
    recipientFilter: {
        siguiendo?: string[];
        estado?: string[];
        producto?: string[];
    };
    totalRecipients: number;
    sentCount: number;
    failedCount: number;
    skippedCount: number;
    pendingCount: number;
    createdBy: string;
    startedAt?: Date;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const CampaignSchema: Schema<Campaign, import("mongoose").Model<Campaign, any, any, any, Document<unknown, any, Campaign, any, {}> & Campaign & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Campaign, Document<unknown, {}, import("mongoose").FlatRecord<Campaign>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Campaign> & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>;
//# sourceMappingURL=campaign.schema.d.ts.map