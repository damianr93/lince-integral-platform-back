import { Schema, Document, Types } from 'mongoose';
export type LogLevel = 'INFO' | 'WARN' | 'ERROR';
export type LogEvent = 'CAMPAIGN_STARTED' | 'CAMPAIGN_COMPLETED' | 'WAVE_STARTED' | 'WAVE_COMPLETED' | 'WAVE_FAILED' | 'WAVE_RESCHEDULED' | 'MESSAGE_SENT' | 'MESSAGE_FAILED' | 'MESSAGE_RETRY';
export interface CampaignLog extends Document {
    campaignId: Types.ObjectId;
    waveNumber?: number;
    level: LogLevel;
    event: LogEvent;
    recipientPhone?: string;
    details?: string;
    createdAt: Date;
}
export declare const CampaignLogSchema: Schema<CampaignLog, import("mongoose").Model<CampaignLog, any, any, any, Document<unknown, any, CampaignLog, any, {}> & CampaignLog & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, CampaignLog, Document<unknown, {}, import("mongoose").FlatRecord<CampaignLog>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<CampaignLog> & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>;
//# sourceMappingURL=campaign-log.schema.d.ts.map