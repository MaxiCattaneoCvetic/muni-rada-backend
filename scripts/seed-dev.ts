/**
 * Sincroniza el esquema (dev) y crea usuarios de desarrollo + demo por rol.
 * Uso: con PostgreSQL levantada (npm run db:up desde la raíz del repo).
 */
import 'reflect-metadata';
import * as fs from 'fs';
import * as path from 'path';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from '../src/users/user.entity';
import { Pedido } from '../src/pedidos/pedido.entity';
import { Presupuesto } from '../src/presupuestos/presupuesto.entity';
import { Pago } from '../src/pagos/pagos.module';
import { Sellado } from '../src/sellados/sellados.module';
import { SistemaConfig } from '../src/config/config.module';
import { Proveedor } from '../src/proveedores/proveedor.entity';
import { DEMO_EMAIL_BY_ROLE } from '../src/auth/demo.constants';

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    console.error('Falta backend/.env (copiá .env.example y completá DATABASE_*).');
    process.exit(1);
  }
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}

const DEV_EMAIL = 'sistemas@radatilly.gob.ar';
const DEV_PASSWORD = 'password';
const DEMO_PASSWORD = 'demo';

const DEMO_PROFILES: Record<
  UserRole,
  { nombre: string; apellido: string }
> = {
  [UserRole.SECRETARIA]: { nombre: 'Ana', apellido: 'Demo (Secretaría)' },
  [UserRole.COMPRAS]: { nombre: 'Bruno', apellido: 'Demo (Compras)' },
  [UserRole.TESORERIA]: { nombre: 'Carla', apellido: 'Demo (Tesorería)' },
  [UserRole.ADMIN]: { nombre: 'Dani', apellido: 'Demo (Admin)' },
};

async function main() {
  loadEnv();

  const ds = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME || 'suministros',
    ssl:
      process.env.DATABASE_SSL === 'true'
        ? { rejectUnauthorized: false }
        : false,
    entities: [User, Pedido, Presupuesto, Proveedor, Pago, Sellado, SistemaConfig],
    synchronize: true,
    logging: false,
  });

  try {
    await ds.initialize();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('No se pudo conectar a PostgreSQL:', msg);
    console.error(
      'Levantá la base: desde la raíz del repo → npm run db:up (Docker Desktop encendido).',
    );
    process.exit(1);
  }

  try {
    const repo = ds.getRepository(User);
    const hashDev = await bcrypt.hash(DEV_PASSWORD, 10);
    const hashDemo = await bcrypt.hash(DEMO_PASSWORD, 10);

    let admin = await repo.findOne({ where: { email: DEV_EMAIL } });
    if (!admin) {
      admin = repo.create({
        email: DEV_EMAIL,
        nombre: 'Lucas',
        apellido: 'Herrera',
        rol: UserRole.ADMIN,
        password: hashDev,
        mustChangePassword: true,
        isActive: true,
      });
      await repo.save(admin);
      console.log(`Usuario admin creado: ${DEV_EMAIL} / ${DEV_PASSWORD}`);
    }

    for (const rol of Object.values(UserRole)) {
      const email = DEMO_EMAIL_BY_ROLE[rol];
      const { nombre, apellido } = DEMO_PROFILES[rol];
      const exists = await repo.findOne({ where: { email } });
      if (exists) continue;
      await repo.save(
        repo.create({
          email,
          nombre,
          apellido,
          rol,
          password: hashDemo,
          mustChangePassword: false,
          isActive: true,
        }),
      );
      console.log(`Usuario demo creado: ${email} (${rol})`);
    }

    const provRepo = ds.getRepository(Proveedor);
    const semillas = [
      { nombre: 'Distribuidora Sur S.A.', cuit: '30-12345678-9', contacto: 'compras@distsur.com' },
      { nombre: 'Ferretería Rada Tilly', contacto: '221 555-0100' },
      { nombre: 'Papelera Patagónica', contacto: 'ventas@papelera.com' },
    ];
    for (const s of semillas) {
      const exists = await provRepo.findOne({ where: { nombre: s.nombre } });
      if (exists) continue;
      await provRepo.save(provRepo.create(s));
      console.log(`Proveedor de ejemplo: ${s.nombre}`);
    }

    console.log('');
    console.log('Listo. Modo demo (POST /api/auth/demo):');
    console.log('  roles → secretaria | compras | tesoreria | admin');
    console.log(`  contraseña opcional para demo users: ${DEMO_PASSWORD}`);
  } finally {
    await ds.destroy();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
