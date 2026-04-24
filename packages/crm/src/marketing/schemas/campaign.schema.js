"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampaignSchema = void 0;
const mongoose_1 = require("mongoose");
exports.CampaignSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    templateName: { type: String, required: true },
    templateLanguage: { type: String, required: true, default: 'es' },
    templateHeaderImageUrl: { type: String },
    waves: [{
            waveNumber: { type: Number, required: true },
            scheduledAt: { type: Date, required: true },
            recipientCount: { type: Number, required: true },
            status: { type: String, enum: ['SCHEDULED', 'RUNNING', 'COMPLETED', 'FAILED'], default: 'SCHEDULED' },
            sentCount: { type: Number, default: 0 },
            failedCount: { type: Number, default: 0 },
            startedAt: { type: Date },
            completedAt: { type: Date },
        }],
    status: {
        type: String,
        enum: ['DRAFT', 'QUEUED', 'RUNNING', 'COMPLETED', 'FAILED'],
        default: 'DRAFT',
        index: true,
    },
    recipientFilter: {
        siguiendo: [{ type: String }],
        estado: [{ type: String }],
        producto: [{ type: String }],
    },
    totalRecipients: { type: Number, default: 0 },
    sentCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    skippedCount: { type: Number, default: 0 },
    pendingCount: { type: Number, default: 0 },
    createdBy: { type: String, required: true },
    startedAt: { type: Date },
    completedAt: { type: Date },
}, {
    timestamps: true,
    collection: 'marketing_campaigns',
});
exports.CampaignSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform(_doc, ret) {
        ret['id'] = ret['_id']?.toString();
        delete ret['_id'];
    },
});
//# sourceMappingURL=campaign.schema.js.map