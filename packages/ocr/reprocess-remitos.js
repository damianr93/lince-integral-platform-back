/**
 * Reprocesa todos los remitos CON_ERRORES con el nuevo pipeline OCR y actualiza
 * extracted_data en la DB. No toca remitos REVISADO (correcciones manuales).
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('/Users/damian/Dev/lince-gestion-integral/lince-platform/node_modules/.pnpm/pg@8.20.0/node_modules/pg');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');

// Env
const env = fs.readFileSync('/Users/damian/Dev/lince-gestion-integral/lince-platform/apps/api/.env', 'utf8');
const get = (k) => env.match(new RegExp(`^${k}=(.*)$`, 'm'))?.[1] ?? '';

const credJson = get('GOOGLE_APPLICATION_CREDENTIALS_JSON');
fs.writeFileSync('/tmp/gcreds.json', credJson);
process.env.GOOGLE_APPLICATION_CREDENTIALS = '/tmp/gcreds.json';

const { DocumentProcessorServiceClient } = require('@google-cloud/documentai');

const ocrDist = '/Users/damian/Dev/lince-gestion-integral/lince-platform/packages/ocr/dist';
const parser = require(path.join(ocrDist, 'vision/vision.parser'));

const s3 = new S3Client({
  region: get('AWS_REGION') || 'sa-east-1',
  credentials: {
    accessKeyId: get('AWS_ACCESS_KEY_ID'),
    secretAccessKey: get('AWS_SECRET_ACCESS_KEY'),
  },
});

const pg = new Client({ connectionString: get('DATABASE_URL') });
const daClient = new DocumentProcessorServiceClient();
const processorName = daClient.processorPath(get('OCR_DOCUMENT_AI_PROJECT_ID'), get('OCR_DOCUMENT_AI_LOCATION') || 'us', get('OCR_DOCUMENT_AI_REMITO_PROCESSOR_ID'));

// --- Helpers que replican lo esencial de vision.service.ts ---
function normalizeText(raw) {
  return raw.normalize('NFC').replace(/\r\n/g, '\n').replace(/\t/g, ' ').replace(/ {2,}/g, ' ').trim();
}
function normalizeKey(raw) {
  return normalizeText(raw).toLowerCase().replace(/[^a-z0-9_\-/]+/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');
}
function getAnchorText(anchor, fullText) {
  if (!anchor || !anchor.textSegments) return '';
  return anchor.textSegments
    .map((s) => fullText.slice(Number(s.startIndex || 0), Number(s.endIndex || 0)))
    .join(' ');
}
function normalizeCuit(raw) {
  const d = raw.replace(/\D/g, '');
  if (d.length !== 11) return raw;
  return `${d.slice(0, 2)}-${d.slice(2, 10)}-${d.slice(10)}`;
}
function pruneEmpty(o) {
  const out = {};
  for (const [k, v] of Object.entries(o)) {
    const c = v?.trim();
    if (c) out[k] = c;
  }
  return out;
}
function buildFormMap(doc) {
  const map = new Map();
  for (const page of doc.pages || []) {
    for (const f of page.formFields || []) {
      const k = normalizeKey(getAnchorText(f.fieldName?.textAnchor, doc.text || ''));
      const v = normalizeText(getAnchorText(f.fieldValue?.textAnchor, doc.text || ''));
      if (k && v && !map.has(k)) map.set(k, v);
    }
  }
  return map;
}

function pickFirst(map, aliases) {
  for (const a of aliases) {
    const v = map.get(normalizeKey(a));
    if (v && v.trim()) return v.trim();
  }
  return '';
}

function extractRemitoFromDocAi(doc) {
  const formMap = buildFormMap(doc);
  const rawText = normalizeText(doc.text || '');
  const form = (aliases) => pickFirst(formMap, aliases);

  const mercaderiaRaw = form(['merced_a_retirada_de_planta', 'mercader_a_retirada_de_planta', 'mercanc_a_retirada_de_planta', 'mercaderia_retirada_de_planta']);
  const nroMercaderia = (/R\d{4}-\d{5,8}/.exec(mercaderiaRaw) ?? [])[0] ?? '';
  const mercMatch = /R(\d{4})-(\d{5,8})/.exec(nroMercaderia);

  let nroRaw = mercMatch ? `${mercMatch[1]}-${mercMatch[2]}` : '';
  if (!nroRaw) {
    // Buscar en text patterns
    for (const re of [
      /(?:\bN\s*[°ºo0]?|\bNRO\.?|\bN[ÚU]M(?:ERO)?\.?)\s*[:.]?\s*([0-9OISl]{4,5}\s*[-–—]\s*[0-9OISl]{5,8})/i,
      /REMITO[^\n]{0,100}?([0-9OISl]{4,5}\s*[-–—]\s*[0-9OISl]{5,8})/i,
      /\bR\s*([0-9OISl]{4,5}\s*[-–—]\s*[0-9OISl]{5,8})/i,
    ]) {
      const m = re.exec(rawText);
      if (m?.[1]) {
        const clean = m[1].replace(/[Oo]/g, '0').replace(/[Il]/g, '1').replace(/[Ss]/g, '5').replace(/[–—]/g, '-').replace(/\s+/g, '');
        const m2 = /^(\d{4,5})-(\d{5,8})$/.exec(clean);
        if (m2) { nroRaw = `${m2[1]}-${m2[2]}`; break; }
      }
    }
  }
  const [ptoVenta = '', nroRemito = ''] = nroRaw ? nroRaw.split(/[-–]/) : [];

  const formText = Array.from(formMap.entries()).map(([k, v]) => `${k} ${v}`).join('\n');
  const combinedText = `${rawText}\n${formText}`;
  const presence = parser.detectRemitoPresence(combinedText);

  const fechaRaw = form(['fecha']);
  const fechaPrimary = /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(fechaRaw.trim()) ? fechaRaw.trim() : '';

  const lugarEntrega = form(['lugar_de_entrega', 'jgar_de_entrega', 'luga_de_entrega', 'lugar_entrega', 'lugar_de_entreg']);
  const cuitCliente = normalizeCuit(form(['cuit_n', 'cuit_cliente']));
  const cuitTransportista = normalizeCuit(form(['c_u_i_t', 'c_u_i_t_', 'cuit_transportista']));
  const domicilioTransportista = form(['domicilio']);
  const camion = form(['cami_n', 'camion', 'cam_n']);
  const chofer = (form(['chofer']) || '').replace(/\s*\(\d+\)\s*$/, '').trim();
  const batea = form(['batea']);

  const primary = pruneEmpty({
    fecha: fechaPrimary,
    ptoVenta: ptoVenta.trim(),
    nroRemito: nroRemito.trim(),
    cuitCliente,
    lugarEntrega,
    nroMercaderia,
    firmaEstado: presence.firmaEstado,
    aclaracionEstado: presence.aclaracionEstado,
    dniEstado: presence.dniEstado,
    chofer,
    camion,
    batea,
    cuitTransportista,
    domicilioTransportista,
  });

  const fallback = parser.parseRemitoText(rawText);
  const { rawText: _r, ...fb } = fallback;

  const merged = { ...fb };
  for (const [k, v] of Object.entries(primary)) if (v?.trim()) merged[k] = v.trim();

  // firmado consistente con firmaEstado
  if (merged.firmaEstado === 'si') merged.firmado = 'si';
  else if (!merged.firmado) merged.firmado = 'no';

  return pruneEmpty(merged);
}

async function downloadFromS3(key) {
  const r = await s3.send(new GetObjectCommand({ Bucket: 'lince-gestion', Key: key }));
  const chunks = [];
  for await (const c of r.Body) chunks.push(c);
  return Buffer.concat(chunks);
}

(async () => {
  await pg.connect();
  const { rows } = await pg.query(
    `SELECT id, s3_key, extracted_data FROM ocr_documents
     WHERE type='REMITO' AND status='CON_ERRORES'
     ORDER BY created_at DESC`,
  );
  console.log(`Reprocesando ${rows.length} remitos…\n`);

  for (const r of rows) {
    process.stdout.write(`[${r.id.slice(0, 8)}] ${r.s3_key.split('/').pop()}\n`);
    try {
      const buf = await downloadFromS3(r.s3_key);
      const [resp] = await daClient.processDocument({
        name: processorName,
        rawDocument: { content: buf.toString('base64'), mimeType: 'image/jpeg' },
      });
      const newFields = extractRemitoFromDocAi(resp.document);

      const before = r.extracted_data || {};
      const changes = [];
      for (const k of ['fecha', 'firmaEstado', 'aclaracionEstado', 'dniEstado']) {
        if ((before[k] ?? '') !== (newFields[k] ?? '')) {
          changes.push(`${k}: "${before[k] ?? ''}" → "${newFields[k] ?? ''}"`);
        }
      }
      if (changes.length === 0) {
        console.log('  sin cambios\n');
        continue;
      }
      changes.forEach((c) => console.log('  ' + c));

      await pg.query(`UPDATE ocr_documents SET extracted_data=$1, updated_at=NOW() WHERE id=$2`, [newFields, r.id]);
      console.log('  ✓ actualizado\n');
    } catch (e) {
      console.error('  ✗ ERROR:', e.message, '\n');
    }
  }

  await pg.end();
})().catch((e) => { console.error(e); process.exit(1); });
