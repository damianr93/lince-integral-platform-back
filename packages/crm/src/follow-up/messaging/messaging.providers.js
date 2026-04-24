"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messagingProviders = void 0;
const config_1 = require("@nestjs/config");
const internal_email_channel_1 = require("./internal-email.channel");
const messaging_gateway_1 = require("./messaging.gateway");
exports.messagingProviders = [
    {
        provide: messaging_gateway_1.MessagingGateway,
        inject: [config_1.ConfigService],
        useFactory: (config) => {
            const channels = [];
            const mailerConfig = {
                host: config.get('MAILER_HOST', ''),
                port: config.get('MAILER_PORT', 587),
                secure: config.get('MAILER_SECURE', 'false') === 'true',
                email: config.get('MAILER_EMAIL', ''),
                password: config.get('MAILER_SECRET_KEY', ''),
            };
            channels.push(new internal_email_channel_1.InternalEmailChannel('INTERNAL_EMAIL', mailerConfig));
            return new messaging_gateway_1.MessagingGateway(channels);
        },
    },
];
//# sourceMappingURL=messaging.providers.js.map