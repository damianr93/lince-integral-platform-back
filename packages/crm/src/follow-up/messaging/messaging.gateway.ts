import { Injectable, Logger } from '@nestjs/common';
import { MessageChannelType } from '../follow-up.types';
import { MessagePayload, MessagingChannel } from './message-channel.interface';

@Injectable()
export class MessagingGateway {
  private readonly logger = new Logger(MessagingGateway.name);
  private readonly channels = new Map<MessageChannelType, MessagingChannel>();

  constructor(channels: MessagingChannel[]) {
    channels.forEach((channel) => {
      this.channels.set(channel.type, channel);
    });
  }

  hasChannel(type: MessageChannelType): boolean {
    return this.channels.has(type);
  }

  async dispatch(type: MessageChannelType, payload: MessagePayload): Promise<void> {
    const channel = this.channels.get(type);

    if (!channel) {
      this.logger.warn(`No channel registered for type ${type}. Payload will be dropped.`);
      return;
    }

    await channel.send(payload);
  }
}
