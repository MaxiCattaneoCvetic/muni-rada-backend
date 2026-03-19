-- ============================================================
-- SUMINISTROS MUNICIPALIDAD DE RADA TILLY
-- Seed inicial: crear usuario Admin para primer acceso
-- Ejecutar en Supabase → SQL Editor
-- ============================================================

-- Nota: Este hash corresponde a la contraseña "Admin123!"
-- El usuario DEBERÁ cambiarla al primer login (mustChangePassword = true)

INSERT INTO users (
  id,
  email,
  nombre,
  apellido,
  rol,
  password,
  must_change_password,
  is_active,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  'sistemas@radatilly.gob.ar',
  'Lucas',
  'Herrera',
  'admin',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  true,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- CONTRASEÑA TEMPORAL: "password"
-- Cambiarla INMEDIATAMENTE luego del primer login
-- ============================================================

-- Verificar que se creó:
SELECT id, email, nombre, apellido, rol, must_change_password, is_active
FROM users
WHERE email = 'sistemas@radatilly.gob.ar';
