import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { FollowUpEventSchema } from './schemas/follow-up-event.schema';
import { FollowUpTaskSchema } from './schemas/follow-up-task.schema';
import { CustomerSchema } from '../customers/schemas/customer.schema';
import { FollowUpEventsService } from './follow-up-events.service';
import { FollowUpEventsController } from './follow-up-events.controller';
import { CustomerFollowUpService } from './customer-follow-up.service';
import { messagingProviders } from './messaging/messaging.providers';
import { MessagingGateway } from './messaging/messaging.gateway';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: 'FollowUpEvent', schema: FollowUpEventSchema },
      { name: 'FollowUpTask', schema: FollowUpTaskSchema },
      { name: 'Customer', schema: CustomerSchema },
    ]),
  ],
  controllers: [FollowUpEventsController],
  providers: [
    FollowUpEventsService,
    CustomerFollowUpService,
    ...messagingProviders,
  ],
  exports: [
    FollowUpEventsService,
    CustomerFollowUpService,
    MessagingGateway,
  ],
})
export class FollowUpModule {}
