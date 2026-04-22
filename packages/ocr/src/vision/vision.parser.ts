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
  fecha:                string;   // Ej: "28/07/2021"
  ptoVenta:             string;   // Ej: "00014"
  nroRemito:            string;   // Ej: "00012686"
  cliente:              string;   // Razón social del destinatario
  cuitCliente:          string;   // CUIT del cliente
  domicilioCliente:     string;   // Domicilio fiscal del cliente
  lugarEntrega:         string;   // Lugar físico de entrega
  toneladas:            string;   // Cantidad entregada (ej: "26,30")
  producto:             string;   // Nombre del producto (ej: "GLUTEN")
  nroMercaderia:        string;   // Nro. de mercadería retirada en planta (ej: "R0014-00012686")
  firmado:              string;   // "si" | "no"
  chofer:               string;   // Nombre del chofer
  camion:               string;   // Patente camión
  batea:                string;   // Patente batea
  cuitTransportista:    string;   // CUIT del transportista
  domicilioTransportista: string; // Domicilio del transportista
  /** Texto completo extraído — útil para depuración */
  rawText:              string;
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

/**
 * Campos extraídos de un certificado de retención SI.CO.RE. (ARCA)
 * Formulario emitido por agentes de retención de Ganancias o Ingresos Brutos.
 */
export interface RetencionFields {
  /** CUIT del Agente de Retención (sección A) — ej: "33-53534712-9" */
  cuitEmisor:   string;
  /** Tipo de impuesto: "GANANCIAS" | "IIBB" */
  tipoImpuesto: string;
  /** Monto de la retención — ej: "436.116,34" */
  monto:        string;
  rawText:      string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Normaliza espacios y saltos de línea del texto raw de Vision.
 *  .normalize('NFC') convierte caracteres descompuestos (NFD) — frecuente en PDFs y
 *  en la salida de Document AI — a forma precompuesta, para que los regex con [oó]
 *  funcionen correctamente. */
function normalizeText(raw: string): string {
  return raw
    .normalize('NFC')
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
  // Número completo del remito: "N° 00014-00012686"
  nroCompleto:           /N[°o]?\s*(\d{4,5}[-–]\d{6,8})/i,

  fecha:                 /FECHA[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,

  // Cliente: línea debajo de "Señor" / "Señores" / "Señories"
  cliente:               /se[nñ]or(?:es|ies)?[:\s]*\n([A-ZÁÉÍÓÚÜÑ][^\n]{3,80})/i,

  // CUIT del cliente: "CUIT N\n20-05534479-6" (sin punto, sección cliente)
  cuitCliente:           /CUIT\s+N[°o]?\s*\n(\d{2}[-\s]\d{7,8}[-\s]\d)/i,

  // Domicilio del cliente: "Domicilio\n<valor>\nIng" (sin dos puntos = cliente)
  domicilioCliente:      /Domicilio\s*\n([^\n]{2,80})\nIng/i,

  // Lugar de entrega: "LUGAR DE ENTREGA" o variantes OCR (JGAR)
  lugarEntrega:          /(?:LUGAR|JGAR|LUGA[R]?)\s+DE\s+ENTREGA[:\s]+([^\n]{3,100})/i,

  // Toneladas: número decimal antes del nombre del producto
  toneladas:             /(\d{1,4}[.,]\d{1,3})\s*\n[A-ZÁÉÍÓÚ]{3}/,

  // Producto: línea en mayúsculas después de las toneladas
  producto:              /\d{1,4}[.,]\d{1,3}\s*\n([A-ZÁÉÍÓÚÜÑ][A-ZÁÉÍÓÚÜÑ ]{2,40})/,

  // Número de mercadería retirada en planta: "R0014-00012686"
  nroMercaderia:         /MERCADER[IÍ]A\s+RETIRADA[^\n]*\n(R\d{4}-\d{5,8})/i,

  // Firma: contenido no vacío después de "FIRMA"
  firma:                 /FIRMA\s*\n((?:(?!ACLA)[^\n]){3,})/i,

  chofer:                /Chofer[:\s]+([^\n(]{3,50})/i,
  camion:                /Cami[oó]n[:\s]+([A-Z0-9]+)/i,
  batea:                 /Batea[:\s]+([A-Z0-9]+)/i,

  // CUIT del transportista: "C.U.I.T.:\n20-31779170-5" (con puntos = transportista)
  cuitTransportista:     /C\.U\.I\.T\.[:\s]+\n?(\d{2}[-\s]\d{7,8}[-\s]\d)/i,

  // Domicilio del transportista: "Domicilio:\n<valor>" (con dos puntos = transportista)
  domicilioTransportista: /Domicilio:\s*\n([^\n]{2,80})/i,
};

// ── Patterns — Retención SI.CO.RE. ────────────────────────────────────────────

/**
 * Patrones para certificados de retención ARCA (SI.CO.RE.).
 *
 * Estructura del documento:
 *  - Sección A: Datos del Agente de Retención → su CUIT
 *  - Sección B: Datos del Sujeto Retenido (Lince S.A.)
 *  - Sección C: Datos de la Retención → impuesto + monto
 *
 * En el texto raw de OCR, el CUIT del emisor aparece antes de
 * la marca "C.U.I.T. Nº" del sujeto retenido.
 */
const RETENCION_PATTERNS = {
  // CUIT del Agente de Retención:
  // Estrategia 1 — aparece justo antes de "C.U.I.T. N" del retenido en el texto raw
  cuitEmisorBeforeRetenido: /(\d{2}[-\s]\d{7,8}[-\s]\d)[\s\n]+C\.U\.I\.T\.?\s*N[º°]/i,

  // Estrategia 2 — etiqueta explícita "C.U.I.T. N° :" de sección A (con signo °)
  cuitEmisorLabel: /C\.U\.I\.T\.?\s+N[°]\s*:?\s*(\d{2}[-\s]\d{7,8}[-\s]\d)/i,

  // Estrategia 3 — primer CUIT en el documento (sección A precede a sección B)
  cuitFirst: /(\d{2}-\d{7,8}-\d)/,

  // Document AI devuelve etiqueta y valor en líneas separadas (tabla 2 columnas):
  //   "Monto de la Retención\n: NO\n:\n$ 436.116,34"
  // [\s\S]{0,120}? cruza saltos de línea de forma no-codiciosa hasta encontrar el "$"
  monto: /Monto\s+de\s+la\s+Retenci.n[\s\S]{0,120}?\$\s*([\d.,]+)/i,

  // Último recurso: importe de dinero con formato argentino DESPUÉS de "IMPORTE RETENIDO" o "Total Retenido"
  montoFallback: /(?:Importe\s+Retenido|Total\s+Retenido)\s*:?\s*\$?\s*([\d.,]+)/i,
};

/**
 * Clasifica el texto del campo "Impuesto" en "GANANCIAS" o "IIBB".
 * Devuelve '' si no coincide con ninguno.
 */
function classifyImpuesto(text: string): string {
  if (/Ingresos?\s+Brutos?|I\.?I\.?B\.?B\.?/i.test(text)) return 'IIBB';
  if (/Ganancias/i.test(text)) return 'GANANCIAS';
  return '';
}

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

  // Tipo de comprobante (letra A/B/C/M/E) — en Argentina siempre es una letra sola en un recuadro.
  // Document AI devuelve: "Código\nA\n01"  (etiqueta → letra → código numérico)
  // Intento 1: "Código\nA" o "Código A" — formato más común (Casa Leconte y similares)
  // Intento 2: "FACTURA A" en la misma línea — facturas que lo imprimen junto al título
  // Intento 3: letra sola entre dos saltos seguida de "Código" — layouts alternativos
  tipoCodigo:    /C[oó]digo\s*\n\s*([ABCME])\b/i,
  tipoSameLine:  /\bFACTURA\s+([ABCME])\b/i,
  tipoNextLine:  /\n([ABCME])\s*\nC[oó]digo\s+\d+/i,
};

// ── Exportados ────────────────────────────────────────────────────────────────

/**
 * Parsea el texto OCR de un REMITO argentino y extrae los campos estructurados.
 * Los campos no detectados quedan como string vacío ''.
 */
export function parseRemitoText(rawText: string): RemitoFields {
  const text = normalizeText(rawText);

  // Número de remito: split en pto de venta y número
  const nroCompleto = extract(text, REMITO_PATTERNS.nroCompleto);
  const [ptoVenta = '', nroRemito = ''] = nroCompleto
    ? nroCompleto.split(/[-–]/)
    : ['', ''];

  // Firma: si hay contenido (nombre/DNI) después de "FIRMA", está firmado
  const firmaContenido = extract(text, REMITO_PATTERNS.firma);
  const firmado = firmaContenido.trim().length > 2 ? 'si' : 'no';

  // Chofer: limpiar el código entre paréntesis "(184)"
  const choferRaw = extract(text, REMITO_PATTERNS.chofer);
  const chofer = choferRaw.replace(/\s*\(\d+\)\s*$/, '').trim();

  return {
    fecha:                  extract(text, REMITO_PATTERNS.fecha),
    ptoVenta:               ptoVenta.trim(),
    nroRemito:              nroRemito.trim(),
    cliente:                extract(text, REMITO_PATTERNS.cliente),
    cuitCliente:            normalizeCuit(extract(text, REMITO_PATTERNS.cuitCliente)),
    domicilioCliente:       extract(text, REMITO_PATTERNS.domicilioCliente),
    lugarEntrega:           extract(text, REMITO_PATTERNS.lugarEntrega),
    toneladas:              extract(text, REMITO_PATTERNS.toneladas),
    producto:               extract(text, REMITO_PATTERNS.producto),
    nroMercaderia:          extract(text, REMITO_PATTERNS.nroMercaderia),
    firmado,
    chofer,
    camion:                 extract(text, REMITO_PATTERNS.camion),
    batea:                  extract(text, REMITO_PATTERNS.batea),
    cuitTransportista:      normalizeCuit(extract(text, REMITO_PATTERNS.cuitTransportista)),
    domicilioTransportista: extract(text, REMITO_PATTERNS.domicilioTransportista),
    rawText:                text,
  };
}

function normalizeCuit(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length !== 11) return raw;
  return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`;
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
    tipo:      extractTipo(text),
    rawText:   text,
  };
}

/**
 * Parsea el texto OCR de un certificado de RETENCIÓN (SI.CO.RE.) y extrae los campos.
 * Los campos no detectados quedan como string vacío ''.
 */
export function parseRetencionText(rawText: string): RetencionFields {
  const text = normalizeText(rawText);

  // CUIT del Agente de Retención — tres estrategias en orden de confianza
  const cuitEmisor = normalizeCuit(
    extract(text, RETENCION_PATTERNS.cuitEmisorBeforeRetenido) ||
    extract(text, RETENCION_PATTERNS.cuitEmisorLabel) ||
    extract(text, RETENCION_PATTERNS.cuitFirst),
  );

  // Tipo de impuesto — buscar en todo el texto
  const tipoImpuesto = classifyImpuesto(text);

  const monto =
    extract(text, RETENCION_PATTERNS.monto) ||
    extract(text, RETENCION_PATTERNS.montoFallback);

  return { cuitEmisor, tipoImpuesto, monto, rawText: text };
}

function extractTipo(text: string): string {
  return (
    extract(text, FACTURA_PATTERNS.tipoCodigo).toUpperCase() ||
    extract(text, FACTURA_PATTERNS.tipoSameLine).toUpperCase() ||
    extract(text, FACTURA_PATTERNS.tipoNextLine).toUpperCase()
  );
}
