/**
 * PATCH /ocr/documents/:id
 *
 * Permite a ADMINISTRATIVO (solo sus facturas) y ADMIN corregir los campos
 * extraídos por OCR que resultaron incorrectos o vacíos.
 *
 * Solo se actualizan los campos incluidos en el body.
 * Al guardar, el sistema recorre los campos requeridos para determinar si
 * quedan errores o si el documento pasa a estado REVISADO.
 */
export declare class UpdateDocumentDto {
    /**
     * Campos OCR a actualizar.
     * Clave = nombre del campo (ej: 'cuit', 'total', 'fecha')
     * Valor = string con el valor corregido
     */
    extractedData?: Record<string, string>;
}
//# sourceMappingURL=update-document.dto.d.ts.map