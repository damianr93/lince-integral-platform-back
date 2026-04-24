import { ConfigService } from '@nestjs/config';
export interface YCloudTemplate {
    id: string;
    wabaId: string;
    name: string;
    language: string;
    status: string;
    category: string;
    content: string;
    headerFormat?: string;
    headerExample?: string;
    footerText?: string;
    buttons?: {
        type: string;
        text: string;
    }[];
}
export interface YCloudSendResult {
    id: string;
    status: string;
    whatsappMessageId?: string;
}
export interface YCloudError {
    code: string;
    message: string;
    status: number;
    isTransient: boolean;
}
export declare class YCloudClient {
    private readonly config;
    private readonly logger;
    constructor(config: ConfigService);
    private get apiKey();
    private headers;
    private normalizeTemplate;
    listApprovedTemplates(): Promise<YCloudTemplate[]>;
    sendTemplateMessage(params: {
        to: string;
        phoneNumberId: string;
        templateName: string;
        templateLanguage: string;
        headerImageUrl?: string;
        externalId?: string;
    }): Promise<YCloudSendResult>;
    verifyWebhookSignature(rawBody: string, signatureHeader: string): Promise<boolean>;
    private buildError;
}
//# sourceMappingURL=ycloud.client.d.ts.map