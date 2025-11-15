-- Migración: Agregar rol 'usuario_pendiente' al ENUM y actualizar usuarios existentes
-- Fecha: 2025-11-15
-- Descripción: Añade el nuevo rol 'usuario_pendiente' para usuarios que aún no han sido aprobados
-- Base de datos: MySQL

-- 1. Modificar la columna ENUM para agregar el nuevo valor
-- En MySQL, se debe redefinir completamente el ENUM
ALTER TABLE usuarios
MODIFY COLUMN rol_global ENUM(
  'admin_global',
  'tenant_admin',
  'admin_consorcio',
  'admin_edificio',
  'proveedor',
  'propietario',
  'inquilino',
  'usuario_pendiente'
) DEFAULT 'usuario_pendiente';

-- 2. Actualizar usuarios existentes que no han sido aprobados
-- Cambiar su rol de 'inquilino' a 'usuario_pendiente' si no están aprobados
UPDATE usuarios
SET rol_global = 'usuario_pendiente'
WHERE aprobado = false
  AND activo = false
  AND rol_global = 'inquilino';

-- 3. Opcional: Verificar los cambios
-- SELECT rol_global, COUNT(*) as total FROM usuarios GROUP BY rol_global;
