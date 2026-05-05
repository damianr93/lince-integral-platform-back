/**
 * VisionParser — Extracción de campos desde texto OCR crudo
 *
 * Retención: pipeline de candidatos + scoring contextual (no regex rígida).
 * Remito / Factura: regex estructuradas (formato fijo conocido).
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

// ── Helpers generales ─────────────────────────────────────────────────────────

/** NFC + espacios/tabs/CR normalizados — necesario para que regex [oó] funcionen con PDFs. */
function normalizeText(raw: string): string {
  return raw
    .normalize('NFC')
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/ {2,}/g, ' ')
    .trim();
}

/** Extrae el grupo 1 del primer match, o '' si no hay match. */
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

// ── Retención: pipeline candidatos + scoring ───────────────────────────────────

interface RetencionCandidate {
  raw: string;
  value: string;
  score: number;
  reason: string;
  pos: number;
}

/**
 * Dígito verificador CUIT/CUIL argentino (algoritmo AFIP).
 * Exportado para poder testearlo de forma aislada.
 */
export function validateCuitChecksum(normalized: string): boolean {
  const digits = normalized.replace(/\D/g, '');
  if (digits.length !== 11) return false;
  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const sum = weights.reduce((acc, w, i) => acc + w * +digits[i], 0);
  const rem = sum % 11;
  const check = rem === 0 ? 0 : 11 - rem;
  if (check === 10) return false; // matemáticamente imposible en un CUIT real
  return check === +digits[10];
}

/**
 * Extrae todos los candidatos CUIT del texto con su score de contexto.
 * Acepta variantes: XX-XXXXXXXX-X / XX XXXXXXXX X / 20.123.456.789 / 11 dígitos juntos.
 */
function extractCuitCandidates(text: string): RetencionCandidate[] {
  // Broad: captura secuencias de 11 dígitos con separadores opcionales [-.\s]
  // Límite superior 20 para cubrir casilleros impresos donde OCR lee cada dígito separado por espacio
  const CUIT_RE = /(?<!\d)(\d[\d.\-\s]{9,20}\d)(?!\d)/g;
  const candidates: RetencionCandidate[] = [];
  let m: RegExpExecArray | null;

  while ((m = CUIT_RE.exec(text)) !== null) {
    const raw = m[1];
    const digits = raw.replace(/\D/g, '');
    if (digits.length !== 11) continue;

    const value = `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`;
    const pos = m.index;
    const before = text.slice(Math.max(0, pos - 200), pos).toLowerCase();

    let score = 0;
    const reasons: string[] = [];

    if (/agente\s+de\s+retenci[oó]n/.test(before)) { score += 4; reasons.push('agente-retención:+4'); }
    else if (/agente/.test(before))                  { score += 2; reasons.push('agente:+2'); }
    if (/emisor/.test(before))                       { score += 2; reasons.push('emisor:+2'); }
    if (/c\.?u\.?i\.?t\.?\s*n[°º]/i.test(before.slice(-80))) { score += 1; reasons.push('label-cuit:+1'); }

    // El CUIT del beneficiario/retenido (Lince S.A.) aparece bajo estas secciones
    if (/beneficiario/.test(before.slice(-200)))          { score -= 3; reasons.push('beneficiario:-3'); }
    if (/retenido|sujeto\s+retenido/.test(before.slice(-200))) { score -= 3; reasons.push('retenido:-3'); }

    if (validateCuitChecksum(value))  { score += 2; reasons.push('checksum:+2'); }
    else                              { score -= 3; reasons.push('checksum-fail:-3'); }

    candidates.push({ raw, value, score, reason: reasons.join(','), pos });
  }

  return candidates;
}

/**
 * Extrae todos los candidatos de monto con su score de contexto.
 * Soporta formato argentino (1.234,56), US (1,234.56), sin separadores (1234,56).
 */
function extractMontoCandidates(text: string): RetencionCandidate[] {
  // Captura: 1.234,56 / 1,234.56 / 50,00 / 50.00 — requiere exactamente 2 decimales
  const AMOUNT_RE = /(?<!\d)(\d{1,3}(?:[.,\s]\d{3})*[.,]\d{2})(?!\d|\s*%)/g;
  const candidates: RetencionCandidate[] = [];
  let m: RegExpExecArray | null;

  while ((m = AMOUNT_RE.exec(text)) !== null) {
    const raw = m[1];
    const allDigits = raw.replace(/[.,\s]/g, '');

    // Filtrar años (2024, 2025…) y valores < $1
    if (/^20\d{2}$/.test(allDigits)) continue;
    const numericVal = parseInt(allDigits, 10) / 100;
    if (isNaN(numericVal) || numericVal < 1) continue;

    const pos = m.index;
    const before = text.slice(Math.max(0, pos - 150), pos).toLowerCase();

    let score = 0;
    const reasons: string[] = [];

    if (/monto\s+de\s+la\s+retenci[oó]n/.test(before))   { score += 5; reasons.push('monto-retención:+5'); }
    else if (/monto/.test(before))                         { score += 3; reasons.push('monto:+3'); }
    // "Retención Practicada" es el label en formularios RG 830 AFIP (manuscritos)
    if (/retenci[oó]n\s+practicada/.test(before))         { score += 5; reasons.push('retención-practicada:+5'); }
    if (/importe\s+retenido/.test(before))                 { score += 4; reasons.push('importe-retenido:+4'); }
    else if (/importe/.test(before))                       { score += 2; reasons.push('importe:+2'); }
    if (/total\s+retenido/.test(before))                   { score += 4; reasons.push('total-retenido:+4'); }
    else if (/total/.test(before))                         { score += 1; reasons.push('total:+1'); }
    if (/retenido/.test(before))                           { score += 1; reasons.push('retenido:+1'); }
    // "Son $ XXX" es la casilla final del formulario RG 830 — siempre es la retención
    if (/\bson\b/.test(before.slice(-30)))                 { score += 3; reasons.push('son-casilla:+3'); }
    if (/\$\s*$/.test(before.slice(-15)))                  { score += 1; reasons.push('$-nearby:+1'); }
    // "Importe del Pago" es el monto bruto, NO la retención — penalizar
    if (/importe\s+del\s+pago/.test(before))               { score -= 3; reasons.push('importe-del-pago:-3'); }

    candidates.push({ raw, value: raw, score, reason: reasons.join(','), pos });
  }

  return candidates;
}

/** Log de diagnóstico activado con OCR_DEBUG=true — no expone datos en producción. */
function debugOcr(field: string, chosen: RetencionCandidate | null, total: number): void {
  if (process.env.OCR_DEBUG !== 'true') return;
  if (!chosen) {
    console.debug(`[OCR-Ret] ${field}: sin candidatos`);
  } else {
    console.debug(
      `[OCR-Ret] ${field}: elegido="${chosen.value}" score=${chosen.score} motivo="${chosen.reason}" total_candidatos=${total}`,
    );
  }
}

/** Clasifica el impuesto en "GANANCIAS" | "IIBB" | '' — busca en todo el texto.
 *  [il] cubre la confusión I↔l frecuente en OCR de manuscritos. */
function classifyImpuesto(text: string): string {
  if (/ingresos?\s+brutos?|i\.?i\.?b\.?b\.?/i.test(text)) return 'IIBB';
  if (/gananc[il]as|imp(?:uesto)?\s+a\s+las\s+ganancias/i.test(text)) return 'GANANCIAS';
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
 * Usa pipeline de candidatos + scoring contextual en lugar de regex únicas.
 * Los campos no detectados quedan como string vacío ''.
 */
export function parseRetencionText(rawText: string): RetencionFields {
  const text = normalizeText(rawText);

  const cuitCandidates = extractCuitCandidates(text);
  cuitCandidates.sort((a, b) => b.score - a.score);
  const bestCuit = cuitCandidates[0] ?? null;
  debugOcr('cuitEmisor', bestCuit, cuitCandidates.length);
  const cuitEmisor = bestCuit?.value ?? '';

  const tipoImpuesto = classifyImpuesto(text);

  const montoCandidates = extractMontoCandidates(text);
  montoCandidates.sort((a, b) => b.score - a.score);
  const bestMonto = montoCandidates[0] ?? null;
  debugOcr('monto', bestMonto, montoCandidates.length);
  const monto = bestMonto?.value ?? '';

  return { cuitEmisor, tipoImpuesto, monto, rawText: text };
}

function extractTipo(text: string): string {
  return (
    extract(text, FACTURA_PATTERNS.tipoCodigo).toUpperCase() ||
    extract(text, FACTURA_PATTERNS.tipoSameLine).toUpperCase() ||
    extract(text, FACTURA_PATTERNS.tipoNextLine).toUpperCase()
  );
}
