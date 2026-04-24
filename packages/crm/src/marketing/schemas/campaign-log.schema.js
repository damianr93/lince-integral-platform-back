"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampaignLogSchema = void 0;
const mongoose_1 = require("mongoose");
exports.CampaignLogSchema = new mongoose_1.Schema({
    campaignId: { type: mongoose_1.Schema.Types.ObjectId, required: true, index: true },
    waveNumber: { type: Number },
    level: { type: String, enum: ['INFO', 'WARN', 'ERROR'], required: true },
    event: { type: String, required: true },
    recipientPhone: { type: String },
    details: { type: String },
}, {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'marketing_campaign_logs',
});
exports.CampaignLogSchema.index({ campaignId: 1, createdAt: -1 });
exports.CampaignLogSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform(_doc, ret) {
        ret['id'] = ret['_id']?.toString();
        delete ret['_id'];
    },
});
//# sourceMappingURL=campaign-log.schema.js.map