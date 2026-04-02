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
  numero:       string;
  fecha:        string;
  proveedor:    string;
  destinatario: string;
  total:        string;
  /** Texto completo extraído — útil para depuración / mejora de reglas */
  rawText:      string;
}

export interface FacturaFields {
  numero:    string;   // Ej: "0001-00012345"
  fecha:     string;   // Ej: "25/03/2026"
  proveedor: string;   // Razón social del emisor
  cuit:      string;   // Ej: "20-12345678-9"
  neto:      string;   // Base imponible
  iva:       string;   // Monto IVA
  total:     string;   // Total factura
  tipo:      string;   // "A", "B", "C", "M", "E"
  rawText:   string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Normaliza espacios y saltos de línea del texto raw de Vision */
function normalizeText(raw: string): string {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/ {2,}/g, ' ')
    .trim();
}

/**
 * Busca el primer match de un patrón en el texto.
 * Devuelve el grupo de captura 1 si existe, o el match completo.
 * Devuelve '' si no hay match.
 */
function extract(text: string, pattern: RegExp): string {
  const m = pattern.exec(text);
  if (!m) return '';
  return (m[1] ?? m[0]).trim();
}

// ── Patterns — Remito ─────────────────────────────────────────────────────────

const REMITO_PATTERNS = {
  numero:       /(?:remito|n[°ºo]?\.?\s*)[:#]?\s*(\d[\d\-]+)/i,
  fecha:        /(?:fecha)[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
  proveedor:    /(?:proveedor|de|emisor|razón social)[:\s]+([A-ZÁÉÍÓÚÜÑ][^\n]{3,60})/i,
  destinatario: /(?:destinatario|a|para|cliente)[:\s]+([A-ZÁÉÍÓÚÜÑ][^\n]{3,60})/i,
  total:        /(?:total|importe total|monto)[:\s$]*\$?\s*([\d.,]+)/i,
};

// ── Patterns — Factura Argentina ──────────────────────────────────────────────

const FACTURA_PATTERNS = {
  // Número de comprobante: XXXX-XXXXXXXX
  numero: /(?:comprobante|n[°ºo]?|factura)[:\s]*(\d{4}[-\s]\d{6,8})/i,

  fecha: /(?:fecha\s+(?:de\s+)?(?:emisi[oó]n|comprobante)?)[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,

  proveedor: /(?:apellido y nombre|raz[oó]n social)[:\s]+([A-ZÁÉÍÓÚÜÑ][^\n]{3,80})/i,

  // CUIT formato argentino: XX-XXXXXXXX-X
  cuit: /(?:c\.?u\.?i\.?t\.?)[:\s]*(\d{2}[-\s]\d{7,8}[-\s]\d)/i,

  // IVA Argentina: "Importe Neto Gravado" o "Base Imponible"
  neto:  /(?:importe neto|neto gravado|base imponible)[:\s$]*\$?\s*([\d.,]+)/i,
  iva:   /(?:i\.?v\.?a\.?\s+\d+%?|impuesto)[:\s$]*\$?\s*([\d.,]+)/i,
  total: /(?:importe total|total)[:\s$]*\$?\s*([\d.,]+)/i,

  // Tipo de comprobante (letra)
  tipo: /\bFACTURA\s+([ABCME])\b/i,
};

// ── Exportados ────────────────────────────────────────────────────────────────

/**
 * Parsea el texto OCR de un REMITO y extrae los campos estructurados.
 * Los campos no detectados quedan como string vacío ''.
 */
export function parseRemitoText(rawText: string): RemitoFields {
  const text = normalizeText(rawText);

  return {
    numero:       extract(text, REMITO_PATTERNS.numero),
    fecha:        extract(text, REMITO_PATTERNS.fecha),
    proveedor:    extract(text, REMITO_PATTERNS.proveedor),
    destinatario: extract(text, REMITO_PATTERNS.destinatario),
    total:        extract(text, REMITO_PATTERNS.total),
    rawText:      text,
  };
}

/**
 * Parsea el texto OCR de una FACTURA argentina y extrae los campos estructurados.
 * Los campos no detectados quedan como string vacío ''.
 */
export function parseFacturaText(rawText: string): FacturaFields {
  const text = normalizeText(rawText);

  return {
    numero:    extract(text, FACTURA_PATTERNS.numero),
    fecha:     extract(text, FACTURA_PATTERNS.fecha),
    proveedor: extract(text, FACTURA_PATTERNS.proveedor),
    cuit:      extract(text, FACTURA_PATTERNS.cuit),
    neto:      extract(text, FACTURA_PATTERNS.neto),
    iva:       extract(text, FACTURA_PATTERNS.iva),
    total:     extract(text, FACTURA_PATTERNS.total),
    tipo:      extract(text, FACTURA_PATTERNS.tipo).toUpperCase(),
    rawText:   text,
  };
}
