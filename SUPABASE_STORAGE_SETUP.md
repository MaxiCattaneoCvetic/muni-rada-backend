# Configuración de Supabase Storage

Este documento explica cómo configurar y migrar el almacenamiento de archivos del sistema de filesystem local a Supabase Storage.

## 🎯 Resumen

Se ha implementado una solución híbrida que permite usar tanto **Supabase Storage** (recomendado para producción) como **filesystem local** (para desarrollo sin Supabase). El sistema detecta automáticamente qué método usar según las variables de entorno configuradas.

## 📋 Requisitos Previos

1. **Cuenta de Supabase**: Crea una cuenta en [supabase.com](https://supabase.com)
2. **Proyecto creado**: Crea un nuevo proyecto en Supabase
3. **Credenciales**: Obtén tus credenciales del proyecto

## 🔑 Variables de Entorno Necesarias

Agrega estas variables a tu archivo `.env`:

```env
# Supabase Storage Configuration
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_KEY=tu_service_role_key_aqui
SUPABASE_STORAGE_BUCKET=suministros
```

### ¿Dónde obtener estos valores?

1. **SUPABASE_URL**
   - Ve a tu proyecto en Supabase Dashboard
   - Settings > API > Project URL
   - Ejemplo: `https://abcdefgh12345678.supabase.co`

2. **SUPABASE_SERVICE_KEY**
   - Settings > API > service_role key (secret)
   - ⚠️ **IMPORTANTE**: Esta clave es secreta, no la compartas ni la subas a GitHub
   - Solo úsala en el backend, nunca en el frontend

3. **SUPABASE_STORAGE_BUCKET**
   - Nombre del bucket donde se almacenarán los archivos
   - Recomendado: `suministros`
   - El script de migración lo creará automáticamente si no existe

## 🚀 Pasos de Configuración

### 1. Configura las Variables de Entorno

Edita tu archivo `.env` y agrega las tres variables mencionadas arriba.

### 2. Reinicia el Backend

```bash
npm run dev
```

El sistema detectará automáticamente que Supabase está configurado y lo usará.

### 3. Migra los Archivos Existentes (Opcional)

Si ya tienes archivos en la carpeta `uploads/`, puedes migrarlos a Supabase:

```bash
npm run migrate:supabase
```

Este script:
- ✅ Crea el bucket automáticamente si no existe
- ✅ Sube todos los archivos de las carpetas locales a Supabase
- ✅ Mantiene la estructura de carpetas (firmas, presupuestos, etc.)
- ✅ Muestra un reporte detallado del proceso
- ✅ Permite reintentarlo si algo falla (usa `upsert: true`)

### 4. Verifica en Supabase Dashboard

1. Ve a Storage en tu proyecto de Supabase
2. Deberías ver el bucket `suministros`
3. Dentro verás las carpetas:
   - `firmas/`
   - `presupuestos/`
   - `sellados/`
   - `facturas/`
   - `facturas_compras/`
   - `referencias_pedidos/`
   - `ordenes_compra/`

### 5. Configura Permisos del Bucket (Importante)

Para que los archivos sean accesibles públicamente:

1. Ve a Storage > Buckets en Supabase Dashboard
2. Selecciona el bucket `suministros`
3. Ve a "Policies"
4. Crea una política de lectura pública:

```sql
-- Política para permitir lectura pública de todos los archivos
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'suministros');

-- Política para permitir escritura solo con service_role (ya está implementado en el backend)
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'suministros');
```

O simplemente marca el bucket como "público" en la configuración.

## 🔄 Cómo Funciona

### Detección Automática

El sistema verifica si `SUPABASE_URL` y `SUPABASE_SERVICE_KEY` están configuradas:

- **Si están configuradas**: Usa Supabase Storage ✅
- **Si NO están configuradas**: Usa filesystem local (carpeta `uploads/`) ⚠️

### Estructura de Archivos en Supabase

Los archivos se organizan igual que en el filesystem local:

```
suministros/  (bucket)
├── firmas/
│   └── firma_user123_1234567890.png
├── presupuestos/
│   └── presupuesto_pedido456_1234567890.pdf
├── sellados/
│   └── sellado_pedido789_1234567890.pdf
├── facturas/
│   └── factura_pedido123_1234567890.pdf
├── facturas_compras/
│   └── factura_compras_pedido456_1234567890.pdf
├── referencias_pedidos/
│   └── ref_pedido789_img1.jpg
└── ordenes_compra/
    └── OC_12345_pedido123.pdf
```

## 📦 Archivos Modificados

- ✅ `src/archivos/supabase-storage.service.ts` - Nuevo servicio de Supabase
- ✅ `src/archivos/archivos.service.ts` - Servicio híbrido (detecta Supabase o filesystem)
- ✅ `scripts/migrate-to-supabase.ts` - Script de migración
- ✅ `.env.example` - Documentación de variables
- ✅ `package.json` - Agregado script `migrate:supabase`

## 🧪 Pruebas

Para probar que todo funciona:

1. **Sube un archivo**: Usa cualquier endpoint que suba archivos (ej: firma, presupuesto)
2. **Descarga el archivo**: Accede a la URL retornada
3. **Verifica en Supabase**: Ve al Dashboard y confirma que el archivo está ahí

## 🆘 Problemas Comunes

### "Supabase Storage no está configurado"

- Verifica que las variables `SUPABASE_URL` y `SUPABASE_SERVICE_KEY` estén en tu `.env`
- Reinicia el servidor después de agregar las variables

### "Error al subir archivo: Bucket not found"

- Ejecuta `npm run migrate:supabase` para crear el bucket automáticamente
- O créalo manualmente en Supabase Dashboard > Storage > New bucket

### "Access denied" o errores de permisos

- Configura las políticas de Storage como se indica en el paso 5
- Verifica que el bucket sea público o tenga las políticas correctas

### Los archivos no son accesibles públicamente

- Ve a Storage > Buckets > suministros
- Marca "Public bucket" o configura las políticas de lectura pública

## 🔐 Seguridad

- ✅ El `SUPABASE_SERVICE_KEY` nunca se expone al frontend
- ✅ Solo el backend tiene acceso de escritura
- ✅ Los archivos son públicos para lectura (necesario para PDFs embebidos)
- ✅ Validaciones de tamaño y tipo de archivo se mantienen
- ✅ Los nombres de archivo incluyen timestamps para evitar colisiones

## 🌐 Producción

Para producción (Railway, etc.):

1. Configura las variables de entorno en tu plataforma
2. Asegúrate de que `SUPABASE_SERVICE_KEY` esté como variable secreta
3. Ya no necesitas montar volumes ni persistir la carpeta `uploads/`
4. Los archivos se almacenan en Supabase (redundancia y backups incluidos)

## 💡 Beneficios de Supabase Storage

- ✅ **Escalabilidad**: No dependes del filesystem del servidor
- ✅ **Persistencia**: Los archivos no se pierden entre deploys
- ✅ **CDN global**: Archivos servidos rápidamente desde cualquier ubicación
- ✅ **Backups**: Supabase hace backups automáticos
- ✅ **Sin infraestructura**: No necesitas configurar S3, volumes, etc.

## 📝 Notas Adicionales

- El código es **retrocompatible**: Si quitas las variables de Supabase, volverá a usar filesystem
- Las URLs generadas por Supabase son permanentes y públicas
- Puedes eliminar la carpeta `uploads/` después de migrar exitosamente
