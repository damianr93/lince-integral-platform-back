import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(__dirname, '../.env') });

import { readFileSync } from 'fs';
import { DOMParser } from '@xmldom/xmldom';
import { DataSource } from 'typeorm';
import { logisticaEntities } from '@lince/logistica';

const KML_PATH = resolve(
  __dirname,
  '../../../../CLIENTES LINCE (3).kmz/doc.kml',
);

interface ParsedPoint {
  carpeta: string;
  iconFile: string;
  nombre: string;
  descripcion: string | null;
  lat: number;
  lng: number;
  orden: number;
}

function stripHtml(str: string): string {
  return str
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function getText(node: Element | null, tag: string): string {
  if (!node) return '';
  const el = node.getElementsByTagName(tag)[0];
  return el?.textContent?.trim() ?? '';
}

function resolveIconFile(
  styleId: string,
  styles: Map<string, string>,
): string {
  const normalId = styleId.replace(/^#/, '') + '-normal';
  const href = styles.get(normalId) ?? styles.get(styleId.replace(/^#/, ''));
  if (!href) return 'icon-1.png';
  // href is like "images/icon-15.png" — extract just the filename
  return href.split('/').pop() ?? 'icon-1.png';
}

function parseKml(kmlPath: string): ParsedPoint[] {
  const xml = readFileSync(kmlPath, 'utf-8');
  const doc = new DOMParser().parseFromString(xml, 'text/xml');

  // Build styleId → icon href map (only -normal variants)
  const styles = new Map<string, string>();
  const styleEls = doc.getElementsByTagName('Style');
  for (let i = 0; i < styleEls.length; i++) {
    const el = styleEls[i] as unknown as Element;
    const id = el.getAttribute('id');
    if (!id) continue;
    const iconStyleEl = el.getElementsByTagName('IconStyle')[0] as unknown as Element | undefined;
    if (!iconStyleEl) continue;
    const hrefEl = iconStyleEl.getElementsByTagName('href')[0];
    if (hrefEl?.textContent) {
      styles.set(id, hrefEl.textContent.trim());
    }
  }

  const points: ParsedPoint[] = [];
  const folders = doc.getElementsByTagName('Folder');

  for (let fi = 0; fi < folders.length; fi++) {
    const folder = folders[fi] as unknown as Element;
    const carpeta = getText(folder, 'name');
    if (!carpeta) continue;

    const placemarks = folder.getElementsByTagName('Placemark');
    for (let pi = 0; pi < placemarks.length; pi++) {
      const pm = placemarks[pi] as unknown as Element;

      // Skip if this placemark is nested inside a sub-folder
      if (pm.parentNode !== folder) continue;

      const nombre = getText(pm, 'name');
      if (!nombre) continue;

      const coordsEl = pm.getElementsByTagName('coordinates')[0];
      if (!coordsEl?.textContent) continue;

      const [lngStr, latStr] = coordsEl.textContent.trim().split(',');
      const lat = parseFloat(latStr ?? '');
      const lng = parseFloat(lngStr ?? '');
      if (isNaN(lat) || isNaN(lng)) continue;

      const styleUrlEl = pm.getElementsByTagName('styleUrl')[0];
      const styleId = styleUrlEl?.textContent?.trim() ?? '';
      const iconFile = resolveIconFile(styleId, styles);

      const descEl = pm.getElementsByTagName('description')[0];
      const rawDesc = descEl?.textContent?.trim() ?? '';
      const descripcion = rawDesc ? stripHtml(rawDesc) : null;

      points.push({ carpeta, iconFile, nombre, descripcion, lat, lng, orden: pi });
    }
  }

  return points;
}

async function seed() {
  const dbUrl = process.env['DATABASE_URL'];
  if (!dbUrl) {
    console.error('❌  Falta DATABASE_URL');
    process.exit(1);
  }

  const ds = new DataSource({
    type: 'postgres',
    url: dbUrl,
    synchronize: false,
    logging: false,
    entities: logisticaEntities,
  });

  await ds.initialize();
  console.log('✅  Conectado a Postgres');

  const runner = ds.createQueryRunner();
  await runner.connect();

  const existing = await runner.query(`SELECT COUNT(*) FROM geo_points`);
  if (parseInt(existing[0].count) > 0) {
    console.log(`ℹ️   Ya existen ${existing[0].count} puntos en geo_points — sin cambios.`);
    await runner.release();
    await ds.destroy();
    return;
  }

  console.log('📍  Parseando KML...');
  const points = parseKml(KML_PATH);
  console.log(`   ${points.length} puntos encontrados en ${new Set(points.map((p) => p.carpeta)).size} carpetas`);

  await runner.startTransaction();
  try {
    for (const p of points) {
      await runner.query(
        `INSERT INTO geo_points ("carpeta", "nombre", "descripcion", "lat", "lng", "iconFile", "orden")
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [p.carpeta, p.nombre, p.descripcion, p.lat, p.lng, p.iconFile, p.orden],
      );
    }
    await runner.commitTransaction();
    console.log(`✅  ${points.length} puntos importados correctamente`);
  } catch (err) {
    await runner.rollbackTransaction();
    console.error('❌  Error en inserción:', err);
    throw err;
  } finally {
    await runner.release();
    await ds.destroy();
  }
}

seed().catch((err) => {
  console.error('❌  Seed geo-layers falló:', err);
  process.exit(1);
});
