import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { FollowUpEvent, FollowUpEventStatus } from './schemas/follow-up-event.schema';
import {
  CustomerStatus,
  FollowUpTemplateId,
  MessageChannelType,
} from './follow-up.types';

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

@Injectable()
export class FollowUpEventsService {
  private readonly logger = new Logger(FollowUpEventsService.name);

  constructor(
    @InjectModel('FollowUpEvent')
    private readonly followUpEventModel: Model<FollowUpEvent>,
  ) {}

  async createEvent(payload: CreateFollowUpEventInput): Promise<FollowUpEvent> {
    return this.followUpEventModel.create({
      ...payload,
      status: 'SCHEDULED',
    });
  }

  async linkTaskToEvent(
    eventId: Types.ObjectId,
    taskId: Types.ObjectId,
  ): Promise<void> {
    await this.followUpEventModel.updateOne(
      { _id: eventId },
      { $set: { followUpTaskId: taskId } },
    );
  }

  async cancelOpenEventsForCustomer(customerId: Types.ObjectId): Promise<void> {
    await this.followUpEventModel.updateMany(
      {
        customerId,
        status: { $in: ['SCHEDULED', 'READY'] as FollowUpEventStatus[] },
      },
      {
        $set: {
          status: 'CANCELLED' as FollowUpEventStatus,
          cancelledAt: new Date(),
          notes: 'Cancelado por cambio de estado del cliente',
        },
      },
    );
  }

  async markDueEventsAsReady(referenceDate = new Date()): Promise<FollowUpEvent[]> {
    const scheduledEvents = await this.followUpEventModel
      .find({
        status: 'SCHEDULED',
        scheduledFor: { $lte: referenceDate },
      })
      .sort({ scheduledFor: 1 })
      .limit(50)
      .lean();

    const updatedEvents: FollowUpEvent[] = [];

    for (const event of scheduledEvents) {
      const updated = await this.followUpEventModel
        .findOneAndUpdate(
          { _id: event._id, status: 'SCHEDULED' },
          {
            $set: {
              status: 'READY' as FollowUpEventStatus,
              readyAt: referenceDate,
            },
          },
          { new: true },
        )
        .lean();

      if (updated) {
        updatedEvents.push(updated as unknown as FollowUpEvent);
      }
    }

    return updatedEvents;
  }

  async markEventCompleted(
    eventId: Types.ObjectId,
    completedAt = new Date(),
    notes?: string,
  ): Promise<FollowUpEvent | null> {
    await this.followUpEventModel.updateOne(
      { _id: eventId },
      {
        $set: {
          status: 'COMPLETED' as FollowUpEventStatus,
          completedAt,
          notes,
        },
      },
    );

    return this.followUpEventModel.findById(eventId).lean() as unknown as Promise<FollowUpEvent | null>;
  }

  async markEventCancelled(
    eventId: Types.ObjectId,
    reason?: string,
  ): Promise<void> {
    await this.followUpEventModel.updateOne(
      { _id: eventId },
      {
        $set: {
          status: 'CANCELLED' as FollowUpEventStatus,
          cancelledAt: new Date(),
          notes: reason,
        },
      },
    );
  }

  async upsertManualStatus(
    eventId: string,
    status: Extract<FollowUpEventStatus, 'READY' | 'COMPLETED' | 'CANCELLED'>,
    notes?: string,
  ): Promise<void> {
    const updates: Partial<FollowUpEvent> = {
      status,
      notes,
    } as Partial<FollowUpEvent>;

    if (status === 'READY') {
      updates.readyAt = new Date();
    }
    if (status === 'COMPLETED') {
      updates.completedAt = new Date();
    }
    if (status === 'CANCELLED') {
      updates.cancelledAt = new Date();
    }

    const result = await this.followUpEventModel.updateOne(
      { _id: eventId },
      { $set: updates },
    );

    if (result.matchedCount === 0) {
      this.logger.warn(`No se encontró evento de seguimiento ${eventId} para actualizar`);
    }
  }

  async getEventsByStatus(
    statuses: FollowUpEventStatus[],
    limit = 50,
    assignedTo?: string,
  ): Promise<FollowUpEvent[]> {
    const filter: FilterQuery<FollowUpEvent> = {
      status: { $in: statuses },
    };

    if (assignedTo && assignedTo.toUpperCase() !== 'ALL') {
      filter.assignedTo = assignedTo.toUpperCase();
    }

    return this.followUpEventModel
      .find(filter)
      .sort({ scheduledFor: 1 })
      .limit(limit)
      .lean() as unknown as Promise<FollowUpEvent[]>;
  }

  async findById(eventId: string): Promise<FollowUpEvent | null> {
    return this.followUpEventModel.findById(eventId).lean() as unknown as Promise<FollowUpEvent | null>;
  }
}
