import { ConfigService } from '@nestjs/config';
import { InternalEmailChannel } from './internal-email.channel';
import { MessagingGateway } from './messaging.gateway';
import { MessagingChannel } from './message-channel.interface';

export const messagingProviders = [
  {
    provide: MessagingGateway,
    inject: [ConfigService],
    useFactory: (config: ConfigService): MessagingGateway => {
      const channels: MessagingChannel[] = [];

      const mailerConfig = {
        host: config.get<string>('MAILER_HOST', ''),
        port: config.get<number>('MAILER_PORT', 587),
        secure: config.get<string>('MAILER_SECURE', 'false') === 'true',
        email: config.get<string>('MAILER_EMAIL', ''),
        password: config.get<string>('MAILER_SECRET_KEY', ''),
      };

      channels.push(new InternalEmailChannel('INTERNAL_EMAIL', mailerConfig));

      return new MessagingGateway(channels);
    },
  },
];
