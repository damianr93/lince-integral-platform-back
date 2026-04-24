"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalEmailChannel = void 0;
const common_1 = require("@nestjs/common");
const nodemailer = __importStar(require("nodemailer"));
class InternalEmailChannel {
    constructor(type, mailerConfig) {
        this.type = type;
        this.mailerConfig = mailerConfig;
        this.logger = new common_1.Logger('InternalEmailChannel');
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
    isEmailConfigured() {
        return !!(this.mailerConfig.host &&
            this.mailerConfig.email &&
            this.mailerConfig.password);
    }
    async send(payload) {
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
            this.logger.log(`Correo interno enviado exitosamente a ${payload.recipient} | MessageID: ${info.messageId}`);
        }
        catch (error) {
            this.logger.error(`Error al enviar correo interno a ${payload.recipient}: ${error.message}`, error.stack);
            throw error;
        }
    }
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    formatAsHtml(text) {
        return text
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');
    }
    async verifyConnection() {
        try {
            if (!this.transporter) {
                this.logger.warn('Transporter de correos internos no está configurado');
                return false;
            }
            await this.transporter.verify();
            this.logger.log('Conexión SMTP de correos internos verificada correctamente');
            return true;
        }
        catch (error) {
            this.logger.error(`Error al verificar conexión SMTP de correos internos: ${error.message}`);
            return false;
        }
    }
}
exports.InternalEmailChannel = InternalEmailChannel;
//# sourceMappingURL=internal-email.channel.js.map