import { Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { MessagePayload, MessagingChannel } from './message-channel.interface';

export class InternalEmailChannel implements MessagingChannel {
  private readonly logger: Logger;
  private readonly transporter: nodemailer.Transporter | null;

  constructor(
    public readonly type: 'INTERNAL_EMAIL',
    private readonly mailerConfig: {
      host: string;
      port: number;
      secure: boolean;
      email: string;
      password: string;
    },
  ) {
    this.logger = new Logger('InternalEmailChannel');

    if (!this.isEmailConfigured()) {
      this.logger.warn('Configuración de email no encontrada. Correos internos no estarán disponibles.');
      this.transporter = null;
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: mailerConfig.host,
      port: mailerConfig.port,
      secure: mailerConfig.secure,
      auth: {
        user: mailerConfig.email,
        pass: mailerConfig.password,
      },
    });

    this.logger.log('Transporter de correos internos inicializado correctamente');
  }

  private isEmailConfigured(): boolean {
    return !!(
      this.mailerConfig.host &&
      this.mailerConfig.email &&
      this.mailerConfig.password
    );
  }

  async send(payload: MessagePayload): Promise<void> {
    try {
      if (!this.transporter) {
        throw new Error('Transporter de correos internos no está configurado. Verifica las variables de entorno de email.');
      }

      if (!payload.recipient || !this.isValidEmail(payload.recipient)) {
        throw new Error(`Email inválido: ${payload.recipient}`);
      }

      const mailOptions = {
        from: `"LinceCRM - Sistema Interno" <${this.mailerConfig.email}>`,
        to: payload.recipient,
        subject: payload.subject || 'Notificación Interna - LinceCRM',
        text: payload.body,
        html: this.formatAsHtml(payload.body),
      };

      const info = await this.transporter.sendMail(mailOptions);

      this.logger.log(
        `Correo interno enviado exitosamente a ${payload.recipient} | MessageID: ${info.messageId}`,
      );
    } catch (error: any) {
      this.logger.error(
        `Error al enviar correo interno a ${payload.recipient}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private formatAsHtml(text: string): string {
    return text
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
  }

  async verifyConnection(): Promise<boolean> {
    try {
      if (!this.transporter) {
        this.logger.warn('Transporter de correos internos no está configurado');
        return false;
      }

      await this.transporter.verify();
      this.logger.log('Conexión SMTP de correos internos verificada correctamente');
      return true;
    } catch (error: any) {
      this.logger.error(`Error al verificar conexión SMTP de correos internos: ${error.message}`);
      return false;
    }
  }
}
