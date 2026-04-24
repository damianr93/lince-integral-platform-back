import { MessageChannelType } from '../follow-up.types';
import { MessagePayload, MessagingChannel } from './message-channel.interface';
export declare class MessagingGateway {
    private readonly logger;
    private readonly channels;
    constructor(channels: MessagingChannel[]);
    hasChannel(type: MessageChannelType): boolean;
    dispatch(type: MessageChannelType, payload: MessagePayload): Promise<void>;
}
//# sourceMappingURL=messaging.gateway.d.ts.map