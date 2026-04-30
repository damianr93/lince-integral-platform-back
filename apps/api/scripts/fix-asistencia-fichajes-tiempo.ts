/**
 * Corrige `asistencia_fichajes.tiempo` sumando o restando un intervalo (p. ej. +3 horas)
 * cuando el ATTLOG se interpretó mal (UTC vs Argentina).
 *
 * Uso (desde apps/api, carga .env de esta carpeta):
 *   pnpm exec ts-node --transpile-only scripts/fix-asistencia-fichajes-tiempo.ts
 *   pnpm exec ts-node --transpile-only scripts/fix-asistencia-fichajes-tiempo.ts --apply --interval "+3 hours" --i-confirm FIX-TIEMPO
 *
 * Filtros opcionales:
 *   --created-before 2026-04-29T00:00:00Z
 *   --created-after 2026-04-01
 *   --planta villa_nueva | tucuman
 *   --utc-hour-lt 11   solo filas cuya hora en UTC es < 11 (evita sumar +3h a fichajes ya bien en la tarde)
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { Client } from 'pg';

dotenv.config({ path: path.join(__dirname, '../.env') });

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  if (i === -1) return undefined;
  return process.argv[i + 1];
}

function hasFlag(name: string): boolean {
  return process.argv.includes(name);
}

async function main() {
  const url = process.env['DATABASE_URL'];
  if (!url) {
    console.error('Falta DATABASE_URL en apps/api/.env');
    process.exit(1);
  }

  const apply = hasFlag('--apply');
  const interval = arg('--interval') ?? '+3 hours';
  const confirm = arg('--i-confirm');
  const createdBefore = arg('--created-before');
  const createdAfter = arg('--created-after');
  const planta = arg('--planta');
  const utcHourLt = arg('--utc-hour-lt');

  const conditions: string[] = ['1=1'];
  const params: unknown[] = [];
  let n = 1;

  if (createdBefore) {
    conditions.push(`created_at < $${n}::timestamptz`);
    params.push(createdBefore);
    n++;
  }
  if (createdAfter) {
    conditions.push(`created_at > $${n}::timestamptz`);
    params.push(createdAfter);
    n++;
  }
  if (planta) {
    conditions.push(`planta = $${n}`);
    params.push(planta);
    n++;
  }
  if (utcHourLt !== undefined) {
    const h = parseInt(utcHourLt, 10);
    if (Number.isNaN(h) || h < 0 || h > 23) {
      console.error('--utc-hour-lt debe ser 0..23');
      process.exit(1);
    }
    conditions.push(`EXTRACT(HOUR FROM (tiempo AT TIME ZONE 'UTC')) < $${n}`);
    params.push(h);
    n++;
  }

  const whereSql = conditions.join(' AND ');

  const client = new Client({ connectionString: url });
  await client.connect();

  try {
    const countRes = await client.query<{ c: string }>(
      `SELECT count(*)::text AS c FROM asistencia_fichajes WHERE ${whereSql}`,
      params,
    );
    const total = countRes.rows[0]?.c ?? '0';
    console.log(`Filas que coinciden con el filtro: ${total}`);

    const previewSql = `
      SELECT id::text, pin, tiempo, tiempo + $${n}::interval AS tiempo_corregido, created_at
      FROM asistencia_fichajes
      WHERE ${whereSql}
      ORDER BY tiempo DESC
      LIMIT 25
    `;
    const previewParams = [...params, interval];
    const preview = await client.query(previewSql, previewParams);
    console.log('\nVista previa (máx 25 filas):');
    console.table(
      preview.rows.map((r) => ({
        id: r.id,
        pin: r.pin,
        tiempo: r.tiempo,
        tiempo_corregido: r.tiempo_corregido,
        created_at: r.created_at,
      })),
    );

    if (!apply) {
      console.log(
        '\nModo solo lectura. Para aplicar: --apply --interval "+3 hours" (o "-3 hours") --i-confirm FIX-TIEMPO',
      );
      return;
    }

    if (confirm !== 'FIX-TIEMPO') {
      console.error('Falta --i-confirm FIX-TIEMPO para ejecutar el UPDATE.');
      process.exit(1);
    }

    const updateSql = `
      UPDATE asistencia_fichajes
      SET tiempo = tiempo + $${n}::interval
      WHERE ${whereSql}
    `;
    const updateParams = [...params, interval];
    const upd = await client.query(updateSql, updateParams);
    console.log(`\nUPDATE aplicado. Filas afectadas: ${upd.rowCount ?? 0}`);
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
