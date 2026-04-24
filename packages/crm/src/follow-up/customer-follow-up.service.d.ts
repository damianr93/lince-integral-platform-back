import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { Customer } from '../customers/schemas/customer.schema';
import { FollowUpTask } from './schemas/follow-up-task.schema';
import { CustomerStatus } from './follow-up.types';
import { MessagingGateway } from './messaging/messaging.gateway';
import { FollowUpEventsService } from './follow-up-events.service';
export declare class CustomerFollowUpService {
    private readonly taskModel;
    private readonly clientModel;
    private readonly followUpEventsService;
    private readonly messagingGateway;
    private readonly config;
    private readonly logger;
    constructor(taskModel: Model<FollowUpTask>, clientModel: Model<Customer>, followUpEventsService: FollowUpEventsService, messagingGateway: MessagingGateway, config: ConfigService);
    private isAutomationEnabled;
    scheduleForStatusChange(customer: Customer, previousStatus?: CustomerStatus | null): Promise<void>;
    private cancelPendingTasks;
    processDueTasks(): Promise<void>;
    private processTask;
    private buildMessage;
    private buildSubject;
    private markTaskAs;
    private notifyAssigneeForManualEvent;
    private sendTaskResultEmail;
    private resolveAssigneeEmail;
    private humanizeStatus;
    private formatDateTime;
    private formatTime;
    private buildContactLine;
    private syncEventStatusFromTask;
    private resolveDeliveryOption;
    private extractContactValue;
    private extractContactValueForChannel;
    /**
     * Normaliza el teléfono para WhatsApp WebJS
     */
    private normalizePhoneForWhatsApp;
}
//# sourceMappingURL=customer-follow-up.service.d.ts.map