"use strict";
/**
 * OcrNotificationsService — Notificaciones por email del módulo OCR
 *
 * Envía emails transaccionales usando Nodemailer + SMTP (Donweb / cualquier proveedor).
 * Si las credenciales SMTP no están configuradas, los emails se loguean en consola
 * (útil para desarrollo sin cuenta SMTP real).
 *
 * Variables de entorno requeridas (compartidas con el resto del sistema):
 *   OCR_SMTP_HOST     — Host del servidor SMTP (ej: mail.donweb.com)
 *   OCR_SMTP_PORT     — Puerto (587 para TLS, 465 para SSL)
 *   OCR_SMTP_SECURE   — "true" para SSL (puerto 465), "false" para STARTTLS
 *   OCR_SMTP_USER     — Usuario / dirección de correo
 *   OCR_SMTP_PASS     — Contraseña
 *   OCR_MAIL_FROM     — Dirección "De" (ej: "Sistema OCR <ocr@empresa.com>")
 *   OCR_ADMIN_EMAIL   — Email del equipo ADMIN para recibir alertas
 */
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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var OcrNotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OcrNotificationsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer = __importStar(require("nodemailer"));
const enums_1 = require("../enums");
let OcrNotificationsService = OcrNotificationsService_1 = class OcrNotificationsService {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(OcrNotificationsService_1.name);
        this.transporter = null;
        this.fromAddress = this.config.get('OCR_MAIL_FROM', 'Sistema OCR <ocr@empresa.com>');
        this.adminEmail = this.config.get('OCR_ADMIN_EMAIL', '');
        this.initTransporter();
    }
    /**
     * Notifica al equipo ADMIN que un documento quedó con errores OCR.
     * Se envía automáticamente después del procesamiento OCR.
     */
    async notifyDocumentWithErrors(alert) {
        if (!this.adminEmail) {
            this.logger.warn('OCR_ADMIN_EMAIL no configurado — email de alerta no enviado');
            return;
        }
        const typeLabel = alert.documentType === enums_1.DocumentType.FACTURA ? 'Factura' : 'Remito';
        const errorList = alert.errors.map((e) => `<li>${e}</li>`).join('');
        const viewLink = alert.viewUrl
            ? `<p><a href="${alert.viewUrl}">Ver documento original</a></p>`
            : '';
        await this.sendMail({
            to: this.adminEmail,
            subject: `[OCR] ${typeLabel} con errores — ID ${alert.documentId.slice(0, 8)}`,
            html: `
        <h2>Documento OCR con errores de validación</h2>
        <table>
          <tr><td><b>Tipo</b></td><td>${typeLabel}</td></tr>
          <tr><td><b>ID</b></td><td>${alert.documentId}</td></tr>
          <tr><td><b>Subido por</b></td><td>${alert.uploadedBy}</td></tr>
        </table>
        <h3>Errores detectados</h3>
        <ul>${errorList}</ul>
        ${viewLink}
        <p>Ingresar al panel para revisar y corregir.</p>
      `,
        });
    }
    /**
     * Notifica al ADMIN que hay un documento en la cola de revisión pendiente.
     */
    async notifyReviewRequired(alert) {
        if (!this.adminEmail)
            return;
        const typeLabel = alert.documentType === enums_1.DocumentType.FACTURA ? 'Factura' : 'Remito';
        await this.sendMail({
            to: this.adminEmail,
            subject: `[OCR] ${typeLabel} pendiente de aprobación — ID ${alert.documentId.slice(0, 8)}`,
            html: `
        <h2>${typeLabel} listo para revisión</h2>
        <p>El documento <b>${alert.documentId}</b> subido por <b>${alert.uploadedBy}</b>
        está pendiente de aprobación en el panel OCR.</p>
      `,
        });
    }
    /**
     * Notifica al usuario que subió el documento sobre el resultado de la aprobación.
     *
     * @param recipientEmail Email del OPERADOR_CAMPO o ADMINISTRATIVO
     */
    async notifyApprovalResult(recipientEmail, documentId, approved, rejectReason) {
        const result = approved ? 'aprobado' : 'rechazado';
        const subject = `[OCR] Tu documento fue ${result}`;
        const reasonHtml = !approved && rejectReason
            ? `<p><b>Motivo:</b> ${rejectReason}</p>`
            : '';
        await this.sendMail({
            to: recipientEmail,
            subject,
            html: `
        <h2>Resultado de revisión OCR</h2>
        <p>Tu documento <b>${documentId}</b> fue <b>${result}</b>.</p>
        ${reasonHtml}
      `,
        });
    }
    // ── Privados ───────────────────────────────────────────────────────────────
    async sendMail(options) {
        if (!this.transporter) {
            // Modo dev: loguear en consola en vez de enviar
            this.logger.debug(`[DEV] Email no enviado (SMTP no configurado)\n` +
                `To: ${options.to}\nSubject: ${options.subject}`);
            return;
        }
        try {
            await this.transporter.sendMail({
                from: this.fromAddress,
                to: options.to,
                subject: options.subject,
                html: options.html,
            });
            this.logger.debug(`Email enviado a ${options.to}: ${options.subject}`);
        }
        catch (err) {
            this.logger.error(`Error enviando email a ${options.to}`, err);
        }
    }
    initTransporter() {
        const host = this.config.get('OCR_SMTP_HOST');
        const port = this.config.get('OCR_SMTP_PORT', 587);
        const secure = this.config.get('OCR_SMTP_SECURE', 'false') === 'true';
        const user = this.config.get('OCR_SMTP_USER');
        const pass = this.config.get('OCR_SMTP_PASS');
        if (!host || !user || !pass) {
            this.logger.warn('SMTP no configurado para OCR. ' +
                'Definir OCR_SMTP_HOST, OCR_SMTP_USER y OCR_SMTP_PASS para enviar emails.');
            return;
        }
        this.transporter = nodemailer.createTransport({
            host,
            port,
            secure,
            auth: { user, pass },
        });
        this.logger.log(`SMTP OCR inicializado — ${host}:${port}`);
    }
};
exports.OcrNotificationsService = OcrNotificationsService;
exports.OcrNotificationsService = OcrNotificationsService = OcrNotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], OcrNotificationsService);
//# sourceMappingURL=notifications.service.js.map