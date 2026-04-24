"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampaignRecipientSchema = void 0;
const mongoose_1 = require("mongoose");
exports.CampaignRecipientSchema = new mongoose_1.Schema({
    campaignId: { type: mongoose_1.Schema.Types.ObjectId, required: true, index: true },
    customerId: { type: mongoose_1.Schema.Types.ObjectId, required: true },
    customerName: { type: String },
    customerPhone: { type: String, required: true },
    siguiendo: { type: String, required: true },
    phoneNumberId: { type: String, required: false, default: '' },
    status: {
        type: String,
        enum: ['PENDING', 'SENT', 'FAILED', 'SKIPPED'],
        default: 'PENDING',
        index: true,
    },
    yCloudMessageId: { type: String },
    skipReason: { type: String },
    errorMessage: { type: String },
    waveNumber: { type: Number },
    attempts: { type: Number, default: 0 },
    retryAfter: { type: Date },
    sentAt: { type: Date },
}, {
    timestamps: true,
    collection: 'marketing_campaign_recipients',
});
// Índice compuesto para procesar pendientes por campaña
exports.CampaignRecipientSchema.index({ campaignId: 1, status: 1 });
exports.CampaignRecipientSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform(_doc, ret) {
        ret['id'] = ret['_id']?.toString();
        delete ret['_id'];
    },
});
//# sourceMappingURL=campaign-recipient.schema.js.map