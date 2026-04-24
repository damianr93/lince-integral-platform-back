/**
 * VisionParser — Extracción de campos desde la respuesta de Google Cloud Vision
 *
 * Google Vision devuelve texto crudo detectado en la imagen.
 * Este módulo contiene la lógica de parsing para extraer campos estructurados
 * tanto de REMITOS como de FACTURAS argentinas.
 *
 * Estrategia:
 *  1. TEXT_DETECTION de Vision devuelve bloques de texto con coordenadas.
 *  2. El texto completo se normaliza y se aplican expresiones regulares
 *     para extraer cada campo.
 *  3. Donde las regex no son suficientes se usan heurísticas de proximidad.
 *
 * IMPORTANTE: Los patrones aquí son un punto de partida sólido.
 * Ajustar según los documentos reales del cliente (proveedores, formatos, etc.)
 */
export interface RemitoFields {
    fecha: string;
    ptoVenta: string;
    nroRemito: string;
    cliente: string;
    cuitCliente: string;
    domicilioCliente: string;
    lugarEntrega: string;
    toneladas: string;
    producto: string;
    nroMercaderia: string;
    firmado: string;
    chofer: string;
    camion: string;
    batea: string;
    cuitTransportista: string;
    domicilioTransportista: string;
    /** Texto completo extraído — útil para depuración */
    rawText: string;
}
export interface FacturaFields {
    numero: string;
    fecha: string;
    proveedor: string;
    cuit: string;
    neto: string;
    iva: string;
    total: string;
    tipo: string;
    rawText: string;
}
/**
 * Campos extraídos de un certificado de retención SI.CO.RE. (ARCA)
 * Formulario emitido por agentes de retención de Ganancias o Ingresos Brutos.
 */
export interface RetencionFields {
    /** CUIT del Agente de Retención (sección A) — ej: "33-53534712-9" */
    cuitEmisor: string;
    /** Tipo de impuesto: "GANANCIAS" | "IIBB" */
    tipoImpuesto: string;
    /** Monto de la retención — ej: "436.116,34" */
    monto: string;
    rawText: string;
}
/**
 * Parsea el texto OCR de un REMITO argentino y extrae los campos estructurados.
 * Los campos no detectados quedan como string vacío ''.
 */
export declare function parseRemitoText(rawText: string): RemitoFields;
/**
 * Parsea el texto OCR de una FACTURA argentina y extrae los campos estructurados.
 * Los campos no detectados quedan como string vacío ''.
 */
export declare function parseFacturaText(rawText: string): FacturaFields;
/**
 * Parsea el texto OCR de un certificado de RETENCIÓN (SI.CO.RE.) y extrae los campos.
 * Los campos no detectados quedan como string vacío ''.
 */
export declare function parseRetencionText(rawText: string): RetencionFields;
//# sourceMappingURL=vision.parser.d.ts.map