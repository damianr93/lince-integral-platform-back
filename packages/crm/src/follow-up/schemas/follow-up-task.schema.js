"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FollowUpTaskSchema = void 0;
const mongoose_1 = require("mongoose");
const DeliveryOptionSchema = new mongoose_1.Schema({
    channel: { type: String, required: true },
    contactPreference: { type: String, required: true },
}, { _id: false });
exports.FollowUpTaskSchema = new mongoose_1.Schema({
    customerId: { type: mongoose_1.Schema.Types.ObjectId, required: true, index: true },
    executeAt: { type: Date, required: true, index: true },
    triggerStatus: { type: String, required: true },
    templateId: { type: String, required: true },
    delivery: { type: [DeliveryOptionSchema], required: true },
    status: { type: String, required: true, default: 'PENDING', index: true },
    attempts: { type: Number, required: true, default: 0 },
    selectedOptionIndex: { type: Number },
    eventId: { type: mongoose_1.Schema.Types.ObjectId, required: false, index: true },
    error: { type: String },
    processedAt: { type: Date },
    cancelledAt: { type: Date },
}, { timestamps: true });
exports.FollowUpTaskSchema.index({ status: 1, executeAt: 1 });
//# sourceMappingURL=follow-up-task.schema.js.map