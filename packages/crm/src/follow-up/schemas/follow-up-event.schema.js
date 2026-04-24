"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FollowUpEventSchema = void 0;
const mongoose_1 = require("mongoose");
exports.FollowUpEventSchema = new mongoose_1.Schema({
    customerId: { type: mongoose_1.Schema.Types.ObjectId, required: true, index: true },
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
    followUpTaskId: { type: mongoose_1.Schema.Types.ObjectId, required: false },
}, { timestamps: true });
exports.FollowUpEventSchema.index({ status: 1, scheduledFor: 1 });
//# sourceMappingURL=follow-up-event.schema.js.map