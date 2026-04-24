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
import { ConfigService } from '@nestjs/config';
import { DocumentType } from '../enums';
interface DocumentAlert {
    documentId: string;
    documentType: DocumentType;
    uploadedBy: string;
    errors: string[];
    viewUrl?: string;
}
export declare class OcrNotificationsService {
    private readonly config;
    private readonly logger;
    private transporter;
    private readonly fromAddress;
    private readonly adminEmail;
    constructor(config: ConfigService);
    /**
     * Notifica al equipo ADMIN que un documento quedó con errores OCR.
     * Se envía automáticamente después del procesamiento OCR.
     */
    notifyDocumentWithErrors(alert: DocumentAlert): Promise<void>;
    /**
     * Notifica al ADMIN que hay un documento en la cola de revisión pendiente.
     */
    notifyReviewRequired(alert: Pick<DocumentAlert, 'documentId' | 'documentType' | 'uploadedBy'>): Promise<void>;
    /**
     * Notifica al usuario que subió el documento sobre el resultado de la aprobación.
     *
     * @param recipientEmail Email del OPERADOR_CAMPO o ADMINISTRATIVO
     */
    notifyApprovalResult(recipientEmail: string, documentId: string, approved: boolean, rejectReason?: string): Promise<void>;
    private sendMail;
    private initTransporter;
}
export {};
//# sourceMappingURL=notifications.service.d.ts.map