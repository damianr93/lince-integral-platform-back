/**
 * PATCH /ocr/documents/:id/approve
 * No requiere body — el endpoint simplemente marca como APROBADO.
 */
export declare class ApproveDocumentDto {
}
/**
 * PATCH /ocr/documents/:id/reject
 *
 * El ADMIN debe indicar el motivo del rechazo.
 * El motivo se guarda en DocumentEntity.rejectReason y se notifica al usuario.
 */
export declare class RejectDocumentDto {
    reason?: string;
}
//# sourceMappingURL=approve-reject.dto.d.ts.map