import { RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import { AuthUser } from '@lince/types';
import { MarketingService } from './marketing.service';
import { YCloudClient } from './ycloud.client';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { SendSingleDto } from './dto/send-single.dto';
export declare class MarketingController {
    private readonly marketingService;
    private readonly ycloud;
    constructor(marketingService: MarketingService, ycloud: YCloudClient);
    getTemplates(): Promise<{
        channelLabel: string;
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
    }[]>;
    sendSingle(dto: SendSingleDto, user: AuthUser): Promise<{
        messageId: string;
        to: string;
    }>;
    getDirectMessages(): Promise<import("./schemas/direct-message.schema").DirectMessage[]>;
    getFilterOptions(): Promise<{
        productos: string[];
    }>;
    findAll(): Promise<import("./schemas/campaign.schema").Campaign[]>;
    previewByFilter(body: {
        siguiendo?: string[];
        estado?: string[];
        producto?: string[];
    }): Promise<{
        customerId: string;
        customerName: string;
        customerPhone: string;
        siguiendo: "EZEQUIEL" | "DENIS" | "MARTIN" | "SIN_ASIGNAR";
        phoneNumberId: string;
        estado: string;
        producto: any;
        willSend: boolean;
        skipReason: string | undefined;
    }[]>;
    findOne(id: string): Promise<import("./schemas/campaign.schema").Campaign>;
    create(dto: CreateCampaignDto, user: AuthUser): Promise<import("./schemas/campaign.schema").Campaign>;
    execute(id: string): Promise<import("./schemas/campaign.schema").Campaign>;
    remove(id: string): Promise<void>;
    previewCampaign(id: string): Promise<{
        customerId: string;
        customerName: string;
        customerPhone: string;
        siguiendo: "EZEQUIEL" | "DENIS" | "MARTIN" | "SIN_ASIGNAR";
        phoneNumberId: string;
        estado: string;
        producto: any;
        willSend: boolean;
        skipReason: string | undefined;
    }[]>;
    getRecipients(id: string): Promise<import("./schemas/campaign-recipient.schema").CampaignRecipient[]>;
    configureWaves(id: string, body: {
        waves: {
            scheduledAt: string;
            recipientCount: number;
        }[];
    }): Promise<import("./schemas/campaign.schema").Campaign>;
    getWaves(id: string): Promise<import("./schemas/campaign.schema").CampaignWave[]>;
    reconfigureScheduledWaves(id: string, body: {
        waves: {
            scheduledAt: string;
            recipientCount: number;
        }[];
    }): Promise<import("./schemas/campaign.schema").Campaign>;
    rescheduleWave(id: string, waveNumber: number, body: {
        scheduledAt: string;
    }): Promise<import("./schemas/campaign.schema").Campaign>;
    retryRecipient(id: string, recipientId: string): Promise<void>;
    updateRecipientPhone(id: string, recipientId: string, body: {
        phone: string;
    }): Promise<void>;
    getLogs(id: string): Promise<import("./schemas/campaign-log.schema").CampaignLog[]>;
    ycloudWebhook(req: RawBodyRequest<Request>, signature: string, payload: Record<string, any>): Promise<{
        ok: boolean;
    }>;
}
//# sourceMappingURL=marketing.controller.d.ts.map