import { MessageChannelType } from '../follow-up.types';

export interface MessagePayload {
  readonly recipient: string;
  readonly body: string;
  readonly subject?: string;
  readonly metadata?: Record<string, unknown>;
}

export interface MessagingChannel {
  readonly type: MessageChannelType;
  send(payload: MessagePayload): Promise<void>;
}
