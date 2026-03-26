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
  attempts: number;
  retryAfter?: Date;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const CampaignRecipientSchema = new Schema<CampaignRecipient>(
  {
    campaignId: { type: Schema.Types.ObjectId, required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, required: true },
    customerName: { type: String },
    customerPhone: { type: String, required: true },
    siguiendo: { type: String, required: true },
    phoneNumberId: { type: String, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'SENT', 'FAILED', 'SKIPPED'],
      default: 'PENDING',
      index: true,
    },
    yCloudMessageId: { type: String },
    skipReason: { type: String },
    errorMessage: { type: String },
    attempts: { type: Number, default: 0 },
    retryAfter: { type: Date },
    sentAt: { type: Date },
  },
  {
    timestamps: true,
    collection: 'marketing_campaign_recipients',
  },
);

// Índice compuesto para procesar pendientes por campaña
CampaignRecipientSchema.index({ campaignId: 1, status: 1 });

CampaignRecipientSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform(_doc, ret: Record<string, any>) {
    ret['id'] = ret['_id']?.toString();
    delete ret['_id'];
  },
});
