import { ConfigService } from '@nestjs/config';
import { MessagingGateway } from './messaging.gateway';
export declare const messagingProviders: {
    provide: typeof MessagingGateway;
    inject: (typeof ConfigService)[];
    useFactory: (config: ConfigService) => MessagingGateway;
}[];
//# sourceMappingURL=messaging.providers.d.ts.map