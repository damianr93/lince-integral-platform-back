import { ContactPreference, CustomerStatus, FollowUpTemplateId, MessageChannelType } from './follow-up.types';
export interface FollowUpDeliveryOption {
    readonly channel: MessageChannelType;
    readonly contactPreference: ContactPreference;
}
export interface FollowUpRule {
    readonly delayMs: number;
    readonly templateId: FollowUpTemplateId;
    readonly delivery: FollowUpDeliveryOption[];
}
export declare const CUSTOMER_FOLLOW_UP_RULES: Partial<Record<CustomerStatus, FollowUpRule>>;
export interface TemplateContext {
    readonly nombre?: string;
    readonly producto?: string;
}
export declare const FOLLOW_UP_TEMPLATE_BUILDERS: Record<FollowUpTemplateId, (context: TemplateContext) => string>;
export declare const FOLLOW_UP_SUBJECTS: Partial<Record<FollowUpTemplateId, string>>;
//# sourceMappingURL=follow-up.rules.d.ts.map