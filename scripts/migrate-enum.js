const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:CiJlOqjpHRopRcdTYnVxEeBauEyqkNHo@hopper.proxy.rlwy.net:30812/railway';

async function run() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  try {
    // Check & rename 'pendiente' → 'abierto'
    const hasPendiente = await client.query(
      `SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
       WHERE t.typname = 'reportes_estado_enum' AND e.enumlabel = 'pendiente'`
    );
    if (hasPendiente.rowCount > 0) {
      await client.query(`ALTER TYPE reportes_estado_enum RENAME VALUE 'pendiente' TO 'abierto'`);
      console.log('✓ pendiente → abierto');
    } else {
      console.log('– pendiente ya no existe (ok)');
    }

    // Check & rename 'revisado' → 'cerrado'
    const hasRevisado = await client.query(
      `SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
       WHERE t.typname = 'reportes_estado_enum' AND e.enumlabel = 'revisado'`
    );
    if (hasRevisado.rowCount > 0) {
      await client.query(`ALTER TYPE reportes_estado_enum RENAME VALUE 'revisado' TO 'cerrado'`);
      console.log('✓ revisado → cerrado');
    } else {
      console.log('– revisado ya no existe (ok)');
    }

    console.log('Migración completada.');
  } finally {
    await client.end();
  }
}

run().catch(e => { console.error(e.message); process.exit(1); });
