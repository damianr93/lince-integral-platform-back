import { Schema, Document, Types } from 'mongoose';

export type CampaignStatus = 'DRAFT' | 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface Campaign extends Document {
  name: string;
  templateName: string;
  templateLanguage: string;
  status: CampaignStatus;
  recipientFilter: {
    siguiendo?: string[];
    estado?: string[];
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

export const CampaignSchema = new Schema<Campaign>(
  {
    name: { type: String, required: true },
    templateName: { type: String, required: true },
    templateLanguage: { type: String, required: true, default: 'es' },
    status: {
      type: String,
      enum: ['DRAFT', 'QUEUED', 'RUNNING', 'COMPLETED', 'FAILED'],
      default: 'DRAFT',
      index: true,
    },
    recipientFilter: {
      siguiendo: [{ type: String }],
      estado: [{ type: String }],
    },
    totalRecipients: { type: Number, default: 0 },
    sentCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    skippedCount: { type: Number, default: 0 },
    pendingCount: { type: Number, default: 0 },
    createdBy: { type: String, required: true },
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  {
    timestamps: true,
    collection: 'marketing_campaigns',
  },
);

CampaignSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform(_doc, ret: Record<string, any>) {
    ret['id'] = ret['_id']?.toString();
    delete ret['_id'];
  },
});
