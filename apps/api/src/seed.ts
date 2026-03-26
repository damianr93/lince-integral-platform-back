import 'reflect-metadata';
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../.env') });

import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';

const EMAIL = process.env['SEED_EMAIL'] ?? 'admin@lince.com';
const PASSWORD = process.env['SEED_PASSWORD'] ?? 'Admin1234!';
const NAME = process.env['SEED_NAME'] ?? 'Admin';

async function seed() {
  const dbUrl = process.env['DATABASE_URL'];
  if (!dbUrl) {
    console.error('❌  Falta DATABASE_URL en el entorno.');
    process.exit(1);
  }

  const ds = new DataSource({
    type: 'postgres',
    url: dbUrl,
    synchronize: false,
    logging: false,
    entities: [],
  });

  await ds.initialize();
  console.log('✅  Conectado a Postgres');

  const runner = ds.createQueryRunner();
  await runner.connect();

  const existing = await runner.query(
    `SELECT id FROM users WHERE email = $1 LIMIT 1`,
    [EMAIL],
  );

  if (existing.length > 0) {
    console.log(`ℹ️   Ya existe un usuario con email ${EMAIL} — sin cambios.`);
    await runner.release();
    await ds.destroy();
    return;
  }

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const modules = JSON.stringify({
    crm: { enabled: true, role: 'ADMIN' },
    conciliaciones: { enabled: true, role: 'ADMIN' },
    ocr: { enabled: true, role: 'ADMIN' },
  });

  await runner.query(
    `INSERT INTO users (email, name, "passwordHash", "globalRole", modules, active, "refreshTokenHash")
     VALUES ($1, $2, $3, 'SUPERADMIN', $4::jsonb, true, NULL)`,
    [EMAIL, NAME, passwordHash, modules],
  );

  console.log('✅  Usuario creado:');
  console.log(`    Email:    ${EMAIL}`);
  console.log(`    Password: ${PASSWORD}`);
  console.log('    Rol:      SUPERADMIN (todos los módulos habilitados)');

  await runner.release();
  await ds.destroy();
}

seed().catch((err) => {
  console.error('❌  Error en seed:', err);
  process.exit(1);
});
