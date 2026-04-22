/**
 * Script de prueba OCR — Document AI directo (sin S3)
 * Uso: node test-ocr.mjs <ruta-imagen> [remito|factura]
 *
 * Lee las credenciales desde apps/api/.env
 */

import { readFileSync } from 'fs';
import { resolve, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Leer .env ──────────────────────────────────────────────────────────────
const envPath = join(__dirname, 'apps/api/.env');
const envVars = {};
for (const line of readFileSync(envPath, 'utf8').split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const idx = trimmed.indexOf('=');
  if (idx === -1) continue;
  envVars[trimmed.slice(0, idx)] = trimmed.slice(idx + 1);
}

const CREDENTIALS_JSON  = envVars['GOOGLE_APPLICATION_CREDENTIALS_JSON'];
const PROJECT_ID        = envVars['OCR_DOCUMENT_AI_PROJECT_ID'];
const LOCATION          = envVars['OCR_DOCUMENT_AI_LOCATION'] || 'us';
const FACTURA_PROC      = envVars['OCR_DOCUMENT_AI_FACTURA_PROCESSOR_ID'];
const REMITO_PROC       = envVars['OCR_DOCUMENT_AI_REMITO_PROCESSOR_ID'];
const OCR_PROC          = envVars['OCR_DOCUMENT_AI_OCR_PROCESSOR_ID'];

if (!CREDENTIALS_JSON || !PROJECT_ID) {
  console.error('❌ Faltan GOOGLE_APPLICATION_CREDENTIALS_JSON u OCR_DOCUMENT_AI_PROJECT_ID en .env');
  process.exit(1);
}

// Escribir credenciales a archivo temporal
import { writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';

const tmpDir   = mkdtempSync(join(tmpdir(), 'lince-ocr-'));
const credFile = join(tmpDir, 'credentials.json');
writeFileSync(credFile, CREDENTIALS_JSON, { mode: 0o600 });
process.env['GOOGLE_APPLICATION_CREDENTIALS'] = credFile;

// ── Args ───────────────────────────────────────────────────────────────────
const imagePath = process.argv[2];
const docType   = (process.argv[3] || 'remito').toLowerCase();

if (!imagePath) {
  console.error('Uso: node test-ocr.mjs <ruta-imagen> [remito|factura]');
  process.exit(1);
}

const imageBuffer = readFileSync(resolve(imagePath));
const ext = extname(imagePath).toLowerCase().slice(1);
const mimeMap = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', pdf: 'application/pdf' };
const mimeType = mimeMap[ext] || 'image/jpeg';

const processorId = docType === 'factura'
  ? (FACTURA_PROC || OCR_PROC)
  : (REMITO_PROC  || OCR_PROC);

if (!processorId) {
  console.error('❌ No hay processor ID configurado para', docType);
  process.exit(1);
}

console.log(`\n📄 Documento: ${imagePath}`);
console.log(`📋 Tipo:      ${docType}`);
console.log(`🔧 Processor: ${processorId}`);
console.log(`📍 Proyecto:  ${PROJECT_ID} (${LOCATION})\n`);
console.log('⏳ Enviando a Document AI...\n');

// ── Llamada a Document AI ──────────────────────────────────────────────────
const { DocumentProcessorServiceClient } = await import('@google-cloud/documentai');

const client = new DocumentProcessorServiceClient();
const name   = client.processorPath(PROJECT_ID, LOCATION, processorId);

const [result] = await client.processDocument({
  name,
  rawDocument: {
    content:  imageBuffer.toString('base64'),
    mimeType,
  },
});

const doc = result.document ?? {};

// ── Texto extraído ─────────────────────────────────────────────────────────
const rawText = (doc.text ?? '').replace(/\r\n/g, '\n').trim();
console.log('═══════════════════════════════════════');
console.log('📝 TEXTO EXTRAÍDO (raw):');
console.log('═══════════════════════════════════════');
console.log(rawText || '(vacío)');

// ── Entidades ──────────────────────────────────────────────────────────────
const entities = doc.entities ?? [];
if (entities.length > 0) {
  console.log('\n═══════════════════════════════════════');
  console.log('🏷️  ENTIDADES DETECTADAS:');
  console.log('═══════════════════════════════════════');
  for (const e of entities) {
    const type  = e.type ?? '?';
    const value = e.normalizedValue?.text || e.mentionText || '';
    const conf  = e.confidence ? ` (${(e.confidence * 100).toFixed(0)}%)` : '';
    console.log(`  ${type.padEnd(30)} → ${value}${conf}`);

    // Sub-propiedades
    for (const prop of (e.properties ?? [])) {
      const pType  = prop.type ?? '?';
      const pValue = prop.normalizedValue?.text || prop.mentionText || '';
      console.log(`    └─ ${pType.padEnd(28)} → ${pValue}`);
    }
  }
}

// ── Form fields ────────────────────────────────────────────────────────────
const pages = doc.pages ?? [];
let formFieldCount = 0;
for (const page of pages) {
  for (const ff of (page.formFields ?? [])) {
    if (formFieldCount === 0) {
      console.log('\n═══════════════════════════════════════');
      console.log('📋 CAMPOS DE FORMULARIO:');
      console.log('═══════════════════════════════════════');
    }
    const getAnchorText = (anchor) => {
      const segs = anchor?.textSegments ?? [];
      return segs.map(s => rawText.slice(Number(s.startIndex ?? 0), Number(s.endIndex ?? 0))).join(' ').trim();
    };
    const key   = getAnchorText(ff.fieldName?.textAnchor);
    const value = getAnchorText(ff.fieldValue?.textAnchor);
    if (key || value) {
      console.log(`  ${(key || '(sin nombre)').padEnd(30)} → ${value}`);
      formFieldCount++;
    }
  }
}

console.log('\n✅ Listo\n');
