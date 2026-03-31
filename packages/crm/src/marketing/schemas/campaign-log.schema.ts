import { Schema, Document, Types } from 'mongoose';

export type LogLevel = 'INFO' | 'WARN' | 'ERROR';
export type LogEvent =
  | 'CAMPAIGN_STARTED'
  | 'CAMPAIGN_COMPLETED'
  | 'WAVE_STARTED'
  | 'WAVE_COMPLETED'
  | 'WAVE_FAILED'
  | 'WAVE_RESCHEDULED'
  | 'MESSAGE_SENT'
  | 'MESSAGE_FAILED'
  | 'MESSAGE_RETRY';

export interface CampaignLog extends Document {
  campaignId: Types.ObjectId;
  waveNumber?: number;
  level: LogLevel;
  event: LogEvent;
  recipientPhone?: string;
  details?: string;
  createdAt: Date;
}

export const CampaignLogSchema = new Schema<CampaignLog>(
  {
    campaignId: { type: Schema.Types.ObjectId, required: true, index: true },
    waveNumber: { type: Number },
    level: { type: String, enum: ['INFO', 'WARN', 'ERROR'], required: true },
    event: { type: String, required: true },
    recipientPhone: { type: String },
    details: { type: String },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'marketing_campaign_logs',
  },
);

CampaignLogSchema.index({ campaignId: 1, createdAt: -1 });

CampaignLogSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform(_doc, ret: Record<string, any>) {
    ret['id'] = ret['_id']?.toString();
    delete ret['_id'];
  },
});
