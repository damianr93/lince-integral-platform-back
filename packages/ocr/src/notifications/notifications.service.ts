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

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { DocumentType } from '../enums';

interface DocumentAlert {
  documentId: string;
  documentType: DocumentType;
  uploadedBy: string;    // nombre o email del que subió
  errors: string[];
  viewUrl?: string;      // presigned URL para ver el doc (opcional)
}

@Injectable()
export class OcrNotificationsService {
  private readonly logger = new Logger(OcrNotificationsService.name);
  private transporter: Transporter | null = null;
  private readonly fromAddress: string;
  private readonly adminEmail: string;

  constructor(private readonly config: ConfigService) {
    this.fromAddress = this.config.get<string>('OCR_MAIL_FROM', 'Sistema OCR <ocr@empresa.com>');
    this.adminEmail  = this.config.get<string>('OCR_ADMIN_EMAIL', '');
    this.initTransporter();
  }

  /**
   * Notifica al equipo ADMIN que un documento quedó con errores OCR.
   * Se envía automáticamente después del procesamiento OCR.
   */
  async notifyDocumentWithErrors(alert: DocumentAlert): Promise<void> {
    if (!this.adminEmail) {
      this.logger.warn('OCR_ADMIN_EMAIL no configurado — email de alerta no enviado');
      return;
    }

    const typeLabel = alert.documentType === DocumentType.FACTURA ? 'Factura' : 'Remito';
    const errorList = alert.errors.map((e) => `<li>${e}</li>`).join('');
    const viewLink  = alert.viewUrl
      ? `<p><a href="${alert.viewUrl}">Ver documento original</a></p>`
      : '';

    await this.sendMail({
      to:      this.adminEmail,
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
  async notifyReviewRequired(alert: Pick<DocumentAlert, 'documentId' | 'documentType' | 'uploadedBy'>): Promise<void> {
    if (!this.adminEmail) return;

    const typeLabel = alert.documentType === DocumentType.FACTURA ? 'Factura' : 'Remito';

    await this.sendMail({
      to:      this.adminEmail,
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
  async notifyApprovalResult(
    recipientEmail: string,
    documentId: string,
    approved: boolean,
    rejectReason?: string,
  ): Promise<void> {
    const result = approved ? 'aprobado' : 'rechazado';
    const subject = `[OCR] Tu documento fue ${result}`;

    const reasonHtml = !approved && rejectReason
      ? `<p><b>Motivo:</b> ${rejectReason}</p>`
      : '';

    await this.sendMail({
      to:      recipientEmail,
      subject,
      html: `
        <h2>Resultado de revisión OCR</h2>
        <p>Tu documento <b>${documentId}</b> fue <b>${result}</b>.</p>
        ${reasonHtml}
      `,
    });
  }

  // ── Privados ───────────────────────────────────────────────────────────────

  private async sendMail(options: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    if (!this.transporter) {
      // Modo dev: loguear en consola en vez de enviar
      this.logger.debug(
        `[DEV] Email no enviado (SMTP no configurado)\n` +
        `To: ${options.to}\nSubject: ${options.subject}`,
      );
      return;
    }

    try {
      await this.transporter.sendMail({
        from:    this.fromAddress,
        to:      options.to,
        subject: options.subject,
        html:    options.html,
      });
      this.logger.debug(`Email enviado a ${options.to}: ${options.subject}`);
    } catch (err) {
      this.logger.error(`Error enviando email a ${options.to}`, err);
    }
  }

  private initTransporter(): void {
    const host   = this.config.get<string>('OCR_SMTP_HOST');
    const port   = this.config.get<number>('OCR_SMTP_PORT', 587);
    const secure = this.config.get<string>('OCR_SMTP_SECURE', 'false') === 'true';
    const user   = this.config.get<string>('OCR_SMTP_USER');
    const pass   = this.config.get<string>('OCR_SMTP_PASS');

    if (!host || !user || !pass) {
      this.logger.warn(
        'SMTP no configurado para OCR. ' +
        'Definir OCR_SMTP_HOST, OCR_SMTP_USER y OCR_SMTP_PASS para enviar emails.',
      );
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
}
