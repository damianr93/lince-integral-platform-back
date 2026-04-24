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
export declare const DirectMessageSchema: Schema<DirectMessage, import("mongoose").Model<DirectMessage, any, any, any, Document<unknown, any, DirectMessage, any, {}> & DirectMessage & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, DirectMessage, Document<unknown, {}, import("mongoose").FlatRecord<DirectMessage>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<DirectMessage> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
//# sourceMappingURL=direct-message.schema.d.ts.map