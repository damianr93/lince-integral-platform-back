/**
 * Test local del pipeline OCR.
 * Uso: pnpm --filter @lince/api exec ts-node --transpile-only -r tsconfig-paths/register src/test-ocr-local.ts
 */
import * as fs   from 'fs';
import * as path from 'path';

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { DocumentProcessorServiceClient } = require('@google-cloud/documentai');
import { parseRemitoText } from '../../../packages/ocr/src/vision/vision.parser';

// ── Imágenes ──────────────────────────────────────────────────────────────────

const IMAGES = [
  { label: 'Remito 00057783 (Nantex — limpio)',  file: '/Users/damian/Downloads/remito-0008-00057783.jpg' },
  { label: 'Remito rotado 90° + hoja A4',        file: '/Users/damian/Downloads/remito-_.jpg' },
  { label: 'Stack ANULADO (sello diagonal)',      file: '/Users/damian/Downloads/62ced7e3-a78e-4600-a061-a32a1cfcc053.jpg' },
];

const ICONS: Record<string, string> = {
  dniEstado: '🪪 ', firmaEstado: '✍️  ', aclaracionEstado: '📝',
  cliente: '🏢', fecha: '📅', nroRemito: '🔢', nroMercaderia: '📦',
};

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const credentials  = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON!);
  const projectId    = process.env.OCR_DOCUMENT_AI_PROJECT_ID!;
  const location     = process.env.OCR_DOCUMENT_AI_LOCATION!;
  const processorId  = process.env.OCR_DOCUMENT_AI_REMITO_PROCESSOR_ID!;

  const client = new DocumentProcessorServiceClient({ credentials });
  const processorName = client.processorPath(projectId, location, processorId);

  console.log('\n🔬 TEST OCR LOCAL\n');

  for (const img of IMAGES) {
    const sep = '─'.repeat(65);
    console.log(`\n${sep}\n  ${img.label}\n${sep}`);

    if (!fs.existsSync(img.file)) {
      console.log(`  ⚠️  No encontrado: ${img.file}`);
      continue;
    }

    try {
      console.log('  📡 Enviando a Document AI...');
      const content = fs.readFileSync(img.file).toString('base64');

      const [result] = await client.processDocument({
        name: processorName,
        rawDocument: { content, mimeType: 'image/jpeg' },
      });

      const rawText: string = (result?.document as any)?.text ?? '';

      console.log('\n  RAW TEXT (600 chars):');
      console.log(rawText.slice(0, 600).replace(/^/gm, '    '));
      if (rawText.length > 600) console.log('    ...(truncado)');

      const parsed = parseRemitoText(rawText);
      const { rawText: _rt, ...fields } = parsed as any;

      console.log('\n  CAMPOS:');
      for (const [k, v] of Object.entries(fields)) {
        if (!v) continue;
        console.log(`    ${(ICONS[k] ?? '   ')} ${k.padEnd(24)} ${v}`);
      }

      const anulado = /\bANULAD[OA]\b/i.test(rawText);
      console.log(`\n  ANULADO en rawText: ${anulado ? '✅ SÍ' : '❌ NO'}`);
      const cercano = rawText.match(/ANUL[A-ZÁÉÍÓÚÜÑ]*/gi);
      if (cercano?.length) console.log(`    variantes: ${[...new Set(cercano)].join(', ')}`);

    } catch (err: any) {
      console.error(`  ❌ ${err.message}`);
    }
  }

  console.log('\n' + '─'.repeat(65) + '\n  ✅ Fin\n' + '─'.repeat(65) + '\n');
}

main().catch(console.error);
