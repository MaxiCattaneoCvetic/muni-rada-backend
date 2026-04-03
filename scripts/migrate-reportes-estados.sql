-- Migración: actualizar estados legacy de reportes
-- Ejecutar UNA SOLA VEZ en la base de datos de producción
-- después de desplegar la nueva versión con los estados actualizados.

-- Primero hay que agregar los nuevos valores al tipo enum
-- (TypeORM synchronize lo hace automáticamente en dev, pero en prod puede necesitarse manualmente)

-- Agrega nuevos valores al enum si no existen
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'pendiente'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'reportes_estado_enum')
  ) THEN
    ALTER TYPE reportes_estado_enum ADD VALUE 'pendiente';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'en_proceso'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'reportes_estado_enum')
  ) THEN
    ALTER TYPE reportes_estado_enum ADD VALUE 'en_proceso';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'solucionado'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'reportes_estado_enum')
  ) THEN
    ALTER TYPE reportes_estado_enum ADD VALUE 'solucionado';
  END IF;
END
$$;

-- Actualiza registros con estados legacy
UPDATE reportes SET estado = 'pendiente'   WHERE estado = 'abierto';
UPDATE reportes SET estado = 'solucionado' WHERE estado = 'resuelto';
