import { MessagePayload, MessagingChannel } from './message-channel.interface';
export declare class InternalEmailChannel implements MessagingChannel {
    readonly type: 'INTERNAL_EMAIL';
    private readonly mailerConfig;
    private readonly logger;
    private readonly transporter;
    constructor(type: 'INTERNAL_EMAIL', mailerConfig: {
        host: string;
        port: number;
        secure: boolean;
        email: string;
        password: string;
    });
    private isEmailConfigured;
    send(payload: MessagePayload): Promise<void>;
    private isValidEmail;
    private formatAsHtml;
    verifyConnection(): Promise<boolean>;
}
//# sourceMappingURL=internal-email.channel.d.ts.map