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

export const FollowUpEventSchema = new Schema<FollowUpEvent>(
  {
    customerId: { type: Schema.Types.ObjectId, required: true, index: true },
    customerName: { type: String },
    customerLastName: { type: String },
    customerPhone: { type: String },
    customerEmail: { type: String },
    assignedTo: { type: String },
    product: { type: String },
    triggerStatus: { type: String, required: true },
    templateId: { type: String, required: true },
    message: { type: String, required: true },
    channels: { type: [String], required: true, default: [] },
    contactValue: { type: String },
    scheduledFor: { type: Date, required: true, index: true },
    readyAt: { type: Date },
    completedAt: { type: Date },
    cancelledAt: { type: Date },
    status: {
      type: String,
      required: true,
      enum: ['SCHEDULED', 'READY', 'COMPLETED', 'CANCELLED'],
      default: 'SCHEDULED',
      index: true,
    },
    notes: { type: String },
    followUpTaskId: { type: Schema.Types.ObjectId, required: false },
  },
  { timestamps: true },
);

FollowUpEventSchema.index({ status: 1, scheduledFor: 1 });
