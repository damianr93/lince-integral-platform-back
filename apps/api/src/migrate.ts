import 'reflect-metadata';
import AppDataSource from './data-source';

async function migrate() {
  await AppDataSource.initialize();
  console.log('✅  Conectado — ejecutando migraciones pendientes...');
  const ran = await AppDataSource.runMigrations({ transaction: 'all' });
  if (ran.length === 0) {
    console.log('ℹ️   No hay migraciones nuevas.');
  } else {
    console.log(`✅  ${ran.length} migración(es) aplicada(s): ${ran.map((m) => m.name).join(', ')}`);
  }
  await AppDataSource.destroy();
}

migrate().catch((err) => {
  console.error('❌  Error en migraciones:', err);
  process.exit(1);
});
