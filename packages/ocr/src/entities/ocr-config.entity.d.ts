import { DocumentType } from '../enums';
/**
 * Configuración de campos requeridos por tipo de documento.
 * SUPERADMIN puede modificar qué campos son obligatorios para cada tipo.
 *
 * Una fila por DocumentType. Se inicializa con valores por defecto en el seed.
 */
export declare class OcrConfigEntity {
    /** DocumentType como PK — solo hay una config por tipo */
    type: DocumentType;
    /**
     * Lista de campos que deben estar presentes y no vacíos tras el OCR.
     * Si alguno falta → status CON_ERRORES.
     *
     * Defaults:
     *   REMITO:  ['nroRemito', 'fecha', 'cliente']
     *   FACTURA: ['numero', 'fecha', 'proveedor', 'cuit', 'total']
     */
    requiredFields: string[];
    /** Descripción libre de cada campo (para mostrar en la UI) */
    fieldLabels: Record<string, string>;
    updatedAt: Date;
}
//# sourceMappingURL=ocr-config.entity.d.ts.map