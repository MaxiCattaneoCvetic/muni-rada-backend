import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SUPABASE_STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'suministros';
const UPLOADS_DIR = process.env.UPLOADS_DIR || './uploads';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: SUPABASE_URL y SUPABASE_SERVICE_KEY deben estar configurados en .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

async function createBucketIfNotExists() {
  console.log(`📦 Verificando bucket '${SUPABASE_STORAGE_BUCKET}'...`);
  
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  
  if (listError) {
    console.error('❌ Error al listar buckets:', listError);
    throw listError;
  }

  const bucketExists = buckets?.some((b) => b.name === SUPABASE_STORAGE_BUCKET);

  if (!bucketExists) {
    console.log(`📦 Creando bucket '${SUPABASE_STORAGE_BUCKET}'...`);
    const { error: createError } = await supabase.storage.createBucket(SUPABASE_STORAGE_BUCKET, {
      public: true,
      fileSizeLimit: 10485760,
    });

    if (createError) {
      console.error('❌ Error al crear bucket:', createError);
      throw createError;
    }
    console.log('✅ Bucket creado exitosamente');
  } else {
    console.log('✅ Bucket ya existe');
  }
}

async function uploadFile(localPath: string, remotePath: string): Promise<boolean> {
  try {
    const fileBuffer = fs.readFileSync(localPath);
    const ext = path.extname(localPath).toLowerCase();
    
    const mimeTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
    };
    
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    const { error } = await supabase.storage
      .from(SUPABASE_STORAGE_BUCKET)
      .upload(remotePath, fileBuffer, {
        contentType,
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.error(`   ❌ Error subiendo ${remotePath}:`, error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error(`   ❌ Error leyendo ${localPath}:`, err);
    return false;
  }
}

async function migrateFolder(folderName: string) {
  const folderPath = path.join(UPLOADS_DIR, folderName);
  
  if (!fs.existsSync(folderPath)) {
    console.log(`⚠️  Carpeta '${folderName}' no existe, omitiendo...`);
    return { success: 0, failed: 0 };
  }

  console.log(`\n📁 Migrando carpeta: ${folderName}`);
  
  const files = fs.readdirSync(folderPath);
  let success = 0;
  let failed = 0;

  for (const file of files) {
    const localPath = path.join(folderPath, file);
    const remotePath = `${folderName}/${file}`;
    
    if (fs.statSync(localPath).isFile()) {
      process.stdout.write(`   📤 Subiendo ${file}... `);
      const uploaded = await uploadFile(localPath, remotePath);
      
      if (uploaded) {
        console.log('✅');
        success++;
      } else {
        console.log('❌');
        failed++;
      }
    }
  }

  return { success, failed };
}

async function main() {
  console.log('🚀 Iniciando migración de archivos a Supabase Storage\n');
  console.log(`   Origen: ${UPLOADS_DIR}`);
  console.log(`   Destino: ${SUPABASE_URL} (bucket: ${SUPABASE_STORAGE_BUCKET})\n`);

  try {
    await createBucketIfNotExists();

    const folders = [
      'firmas',
      'presupuestos',
      'presupuestos_firmados',
      'sellados',
      'facturas',
      'facturas_compras',
      'referencias_pedidos',
      'ordenes_compra',
    ];

    let totalSuccess = 0;
    let totalFailed = 0;

    for (const folder of folders) {
      const { success, failed } = await migrateFolder(folder);
      totalSuccess += success;
      totalFailed += failed;
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE MIGRACIÓN');
    console.log('='.repeat(60));
    console.log(`✅ Archivos migrados exitosamente: ${totalSuccess}`);
    console.log(`❌ Archivos con errores: ${totalFailed}`);
    console.log('='.repeat(60));

    if (totalFailed === 0) {
      console.log('\n🎉 ¡Migración completada sin errores!');
      console.log('\n💡 Próximos pasos:');
      console.log('   1. Verifica que los archivos estén accesibles en Supabase Dashboard');
      console.log('   2. Actualiza tu .env con las variables de Supabase');
      console.log('   3. Reinicia el backend para usar Supabase Storage');
      console.log('   4. Prueba subir y descargar archivos');
      console.log('   5. Una vez confirmado, puedes eliminar la carpeta uploads/');
    } else {
      console.log('\n⚠️  Migración completada con algunos errores');
      console.log('   Revisa los mensajes de error arriba y reintenta la migración');
    }

  } catch (error) {
    console.error('\n❌ Error fatal durante la migración:', error);
    process.exit(1);
  }
}

main();
