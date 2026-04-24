import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { Campaign } from './schemas/campaign.schema';
import { CampaignRecipient } from './schemas/campaign-recipient.schema';
import { CampaignLog } from './schemas/campaign-log.schema';
import { DirectMessage } from './schemas/direct-message.schema';
import { Customer } from '../customers/schemas/customer.schema';
import { YCloudClient } from './ycloud.client';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { SendSingleDto } from './dto/send-single.dto';
export declare class MarketingService {
    private readonly campaignModel;
    private readonly recipientModel;
    private readonly logModel;
    private readonly directMessageModel;
    private readonly customerModel;
    private readonly ycloud;
    private readonly config;
    private readonly logger;
    constructor(campaignModel: Model<Campaign>, recipientModel: Model<CampaignRecipient>, logModel: Model<CampaignLog>, directMessageModel: Model<DirectMessage>, customerModel: Model<Customer>, ycloud: YCloudClient, config: ConfigService);
    private resolvePhoneNumberId;
    private normalizePhone;
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
    getFilterOptions(): Promise<{
        productos: string[];
    }>;
    private buildPreviewItems;
    previewByFilter(filter: {
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
    previewCampaign(campaignId: string): Promise<{
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
    private countEligibleWillSend;
    private buildWaveDocuments;
    private assertWavesMatchEligibleRecipients;
    sendSingle(dto: SendSingleDto, userId: string): Promise<{
        messageId: string;
        to: string;
    }>;
    getDirectMessages(): Promise<DirectMessage[]>;
    create(dto: CreateCampaignDto, userId: string): Promise<Campaign>;
    findAll(): Promise<Campaign[]>;
    findById(id: string): Promise<Campaign>;
    getRecipients(campaignId: string): Promise<CampaignRecipient[]>;
    retryRecipient(campaignId: string, recipientId: string): Promise<void>;
    updateRecipientPhone(campaignId: string, recipientId: string, phone: string): Promise<void>;
    remove(id: string): Promise<void>;
    private writeLog;
    getLogs(campaignId: string): Promise<CampaignLog[]>;
    configureWaves(campaignId: string, waves: {
        scheduledAt: Date;
        recipientCount: number;
    }[]): Promise<Campaign>;
    reconfigureScheduledWaves(campaignId: string, newWaves: {
        scheduledAt: Date;
        recipientCount: number;
    }[]): Promise<Campaign>;
    rescheduleWave(campaignId: string, waveNumber: number, scheduledAt: Date): Promise<Campaign>;
    execute(campaignId: string): Promise<Campaign>;
    processPendingRecipients(): Promise<void>;
    private processCampaignBatch;
    private sendToRecipient;
    private checkCampaignCompletion;
    handleWebhook(payload: Record<string, any>): Promise<void>;
}
//# sourceMappingURL=marketing.service.d.ts.map