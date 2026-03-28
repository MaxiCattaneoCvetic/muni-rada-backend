"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const typeorm_1 = require("typeorm");
const bcrypt = __importStar(require("bcryptjs"));
const user_entity_1 = require("../src/users/user.entity");
const pedido_entity_1 = require("../src/pedidos/pedido.entity");
const presupuesto_entity_1 = require("../src/presupuestos/presupuesto.entity");
const pagos_module_1 = require("../src/pagos/pagos.module");
const sellados_module_1 = require("../src/sellados/sellados.module");
const config_module_1 = require("../src/config/config.module");
const demo_constants_1 = require("../src/auth/demo.constants");
function loadEnv() {
    const envPath = path.join(__dirname, '..', '.env');
    if (!fs.existsSync(envPath)) {
        console.error('Falta backend/.env (copiá .env.example y completá DATABASE_*).');
        process.exit(1);
    }
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#'))
            continue;
        const eq = trimmed.indexOf('=');
        if (eq === -1)
            continue;
        const key = trimmed.slice(0, eq).trim();
        let val = trimmed.slice(eq + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) ||
            (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
        }
        process.env[key] = val;
    }
}
const DEV_EMAIL = 'sistemas@radatilly.gob.ar';
const DEV_PASSWORD = 'password';
const DEMO_PASSWORD = 'demo';
const DEMO_PROFILES = {
    [user_entity_1.UserRole.SECRETARIA]: { nombre: 'Ana', apellido: 'Demo (Secretaría)' },
    [user_entity_1.UserRole.COMPRAS]: { nombre: 'Bruno', apellido: 'Demo (Compras)' },
    [user_entity_1.UserRole.TESORERIA]: { nombre: 'Carla', apellido: 'Demo (Tesorería)' },
    [user_entity_1.UserRole.ADMIN]: { nombre: 'Dani', apellido: 'Demo (Admin)' },
};
async function main() {
    loadEnv();
    const ds = new typeorm_1.DataSource({
        type: 'postgres',
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT || '5432', 10),
        username: process.env.DATABASE_USER || 'postgres',
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME || 'suministros',
        ssl: process.env.DATABASE_SSL === 'true'
            ? { rejectUnauthorized: false }
            : false,
        entities: [user_entity_1.User, pedido_entity_1.Pedido, presupuesto_entity_1.Presupuesto, pagos_module_1.Pago, sellados_module_1.Sellado, config_module_1.SistemaConfig],
        synchronize: true,
        logging: false,
    });
    try {
        await ds.initialize();
    }
    catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error('No se pudo conectar a PostgreSQL:', msg);
        console.error('Levantá la base: desde la raíz del repo → npm run db:up (Docker Desktop encendido).');
        process.exit(1);
    }
    try {
        const repo = ds.getRepository(user_entity_1.User);
        const hashDev = await bcrypt.hash(DEV_PASSWORD, 10);
        const hashDemo = await bcrypt.hash(DEMO_PASSWORD, 10);
        let admin = await repo.findOne({ where: { email: DEV_EMAIL } });
        if (!admin) {
            admin = repo.create({
                email: DEV_EMAIL,
                nombre: 'Lucas',
                apellido: 'Herrera',
                rol: user_entity_1.UserRole.ADMIN,
                password: hashDev,
                mustChangePassword: true,
                isActive: true,
            });
            await repo.save(admin);
            console.log(`Usuario admin creado: ${DEV_EMAIL} / ${DEV_PASSWORD}`);
        }
        for (const rol of Object.values(user_entity_1.UserRole)) {
            const email = demo_constants_1.DEMO_EMAIL_BY_ROLE[rol];
            const { nombre, apellido } = DEMO_PROFILES[rol];
            const exists = await repo.findOne({ where: { email } });
            if (exists)
                continue;
            await repo.save(repo.create({
                email,
                nombre,
                apellido,
                rol,
                password: hashDemo,
                mustChangePassword: false,
                isActive: true,
            }));
            console.log(`Usuario demo creado: ${email} (${rol})`);
        }
        console.log('');
        console.log('Listo. Modo demo (POST /api/auth/demo):');
        console.log('  roles → secretaria | compras | tesoreria | admin');
        console.log(`  contraseña opcional para demo users: ${DEMO_PASSWORD}`);
    }
    finally {
        await ds.destroy();
    }
}
main().catch((e) => {
    console.error(e);
    process.exit(1);
});
//# sourceMappingURL=seed-dev.js.map