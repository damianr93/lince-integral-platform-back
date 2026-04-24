import { Model, Types } from 'mongoose';
import { FollowUpEvent, FollowUpEventStatus } from './schemas/follow-up-event.schema';
import { CustomerStatus, FollowUpTemplateId, MessageChannelType } from './follow-up.types';
interface CreateFollowUpEventInput {
    customerId: Types.ObjectId;
    customerName?: string;
    customerLastName?: string;
    customerPhone?: string;
    customerEmail?: string;
    assignedTo?: string;
    product?: string;
    triggerStatus: CustomerStatus;
    templateId: FollowUpTemplateId;
    message: string;
    channels: MessageChannelType[];
    contactValue?: string | null;
    scheduledFor: Date;
}
export declare class FollowUpEventsService {
    private readonly followUpEventModel;
    private readonly logger;
    constructor(followUpEventModel: Model<FollowUpEvent>);
    createEvent(payload: CreateFollowUpEventInput): Promise<FollowUpEvent>;
    linkTaskToEvent(eventId: Types.ObjectId, taskId: Types.ObjectId): Promise<void>;
    cancelOpenEventsForCustomer(customerId: Types.ObjectId): Promise<void>;
    markDueEventsAsReady(referenceDate?: Date): Promise<FollowUpEvent[]>;
    markEventCompleted(eventId: Types.ObjectId, completedAt?: Date, notes?: string): Promise<FollowUpEvent | null>;
    markEventCancelled(eventId: Types.ObjectId, reason?: string): Promise<void>;
    upsertManualStatus(eventId: string, status: Extract<FollowUpEventStatus, 'READY' | 'COMPLETED' | 'CANCELLED'>, notes?: string): Promise<void>;
    getEventsByStatus(statuses: FollowUpEventStatus[], limit?: number, assignedTo?: string): Promise<FollowUpEvent[]>;
    findById(eventId: string): Promise<FollowUpEvent | null>;
}
export {};
//# sourceMappingURL=follow-up-events.service.d.ts.map