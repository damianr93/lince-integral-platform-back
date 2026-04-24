"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DirectMessageSchema = void 0;
const mongoose_1 = require("mongoose");
exports.DirectMessageSchema = new mongoose_1.Schema({
    phone: { type: String, required: true, index: true },
    advisor: { type: String, required: true },
    templateName: { type: String, required: true },
    templateLanguage: { type: String, required: true },
    yCloudMessageId: { type: String, required: true },
    sentBy: { type: String, required: true },
}, {
    timestamps: true,
    collection: 'marketing_direct_messages',
});
exports.DirectMessageSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform(_doc, ret) {
        ret['id'] = ret['_id']?.toString();
        delete ret['_id'];
    },
});
//# sourceMappingURL=direct-message.schema.js.map