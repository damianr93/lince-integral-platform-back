import { Document, Schema, Types } from 'mongoose';
import { FollowUpDeliveryOption } from '../follow-up.rules';
import {
  CustomerStatus,
  FollowUpTaskStatus,
  FollowUpTemplateId,
} from '../follow-up.types';

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

const DeliveryOptionSchema = new Schema<FollowUpDeliveryOption>(
  {
    channel: { type: String, required: true },
    contactPreference: { type: String, required: true },
  },
  { _id: false },
);

export const FollowUpTaskSchema = new Schema<FollowUpTask>(
  {
    customerId: { type: Schema.Types.ObjectId, required: true, index: true },
    executeAt: { type: Date, required: true, index: true },
    triggerStatus: { type: String, required: true },
    templateId: { type: String, required: true },
    delivery: { type: [DeliveryOptionSchema], required: true },
    status: { type: String, required: true, default: 'PENDING', index: true },
    attempts: { type: Number, required: true, default: 0 },
    selectedOptionIndex: { type: Number },
    eventId: { type: Schema.Types.ObjectId, required: false, index: true },
    error: { type: String },
    processedAt: { type: Date },
    cancelledAt: { type: Date },
  },
  { timestamps: true },
);

FollowUpTaskSchema.index({ status: 1, executeAt: 1 });
