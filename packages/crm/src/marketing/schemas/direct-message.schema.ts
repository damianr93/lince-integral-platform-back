import { Schema, Document } from 'mongoose';

export interface DirectMessage extends Document {
  phone: string;
  advisor: string;
  templateName: string;
  templateLanguage: string;
  yCloudMessageId: string;
  sentBy: string;
  createdAt: Date;
}

export const DirectMessageSchema = new Schema<DirectMessage>(
  {
    phone: { type: String, required: true, index: true },
    advisor: { type: String, required: true },
    templateName: { type: String, required: true },
    templateLanguage: { type: String, required: true },
    yCloudMessageId: { type: String, required: true },
    sentBy: { type: String, required: true },
  },
  {
    timestamps: true,
    collection: 'marketing_direct_messages',
  },
);

DirectMessageSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform(_doc, ret: Record<string, any>) {
    ret['id'] = ret['_id']?.toString();
    delete ret['_id'];
  },
});
