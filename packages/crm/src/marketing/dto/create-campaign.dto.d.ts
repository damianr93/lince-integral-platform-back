export declare class RecipientFilterDto {
    siguiendo?: string[];
    estado?: string[];
    producto?: string[];
}
export declare class CreateCampaignWaveDto {
    scheduledAt: string;
    recipientCount: number;
}
export declare class CreateCampaignDto {
    name: string;
    templateName: string;
    templateLanguage: string;
    templateHeaderImageUrl?: string;
    recipientFilter?: RecipientFilterDto;
    waves?: CreateCampaignWaveDto[];
}
//# sourceMappingURL=create-campaign.dto.d.ts.map