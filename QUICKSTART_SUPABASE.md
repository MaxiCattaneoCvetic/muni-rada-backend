# 🚀 Guía Rápida: Supabase Storage

## ¿Qué se implementó?

Se migró el sistema de almacenamiento de archivos de **filesystem local** a **Supabase Storage** con una solución híbrida que permite usar ambos métodos.

## ⚡ Inicio Rápido

### 1. Obtén tus credenciales de Supabase

Ve a [supabase.com](https://supabase.com) y obtén:

```
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJh...tu_service_role_key
SUPABASE_STORAGE_BUCKET=suministros
```

**Ubicación en Supabase Dashboard:**
- URL: Settings > API > Project URL
- Service Key: Settings > API > service_role (secret) ⚠️

### 2. Agrégalas a tu `.env`

```env
# Supabase Storage
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJh...tu_service_role_key
SUPABASE_STORAGE_BUCKET=suministros
```

### 3. Reinicia el servidor

```bash
npm run dev
```

¡Listo! El sistema ahora usa Supabase automáticamente.

### 4. Migra archivos existentes (opcional)

Si tienes archivos en `uploads/`:

```bash
npm run migrate:supabase
```

## 📝 Resumen de Variables

| Variable | Descripción | Dónde obtenerla |
|----------|-------------|-----------------|
| `SUPABASE_URL` | URL de tu proyecto | Settings > API > Project URL |
| `SUPABASE_SERVICE_KEY` | Clave secreta del servidor | Settings > API > service_role key |
| `SUPABASE_STORAGE_BUCKET` | Nombre del bucket | Elige uno (ej: `suministros`) |

## ✅ Verificación

1. **¿Las variables están en el `.env`?** ✓
2. **¿Reiniciaste el servidor?** ✓
3. **¿Creaste el bucket en Supabase?** (el script de migración lo hace por ti)
4. **¿El bucket es público?** (marca "Public bucket" en Supabase Dashboard)

## 🔍 Solución de Problemas

### El backend no usa Supabase

- Verifica que las 3 variables estén en `.env`
- Reinicia el servidor con `npm run dev`
- Revisa los logs al iniciar el servidor

### "Bucket not found"

```bash
npm run migrate:supabase
```

Esto creará el bucket automáticamente.

### Los archivos no son públicos

1. Ve a Storage > Buckets en Supabase
2. Click en tu bucket `suministros`
3. Marca "Public bucket" o agrega política:

```sql
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'suministros');
```

## 📚 Documentación Completa

Ver: [`SUPABASE_STORAGE_SETUP.md`](./SUPABASE_STORAGE_SETUP.md)

## 🎯 ¿Qué Archivos se Suben?

- ✅ Firmas de usuarios
- ✅ Presupuestos (PDF)
- ✅ Comprobantes sellados (PDF)
- ✅ Facturas (PDF)
- ✅ Facturas de compras (PDF)
- ✅ Imágenes de referencia (pedidos)
- ✅ Órdenes de compra (PDF)

Todos se organizan en carpetas dentro del bucket.
