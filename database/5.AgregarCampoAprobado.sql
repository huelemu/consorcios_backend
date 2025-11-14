-- =====================================================
-- MIGRACIÓN: Agregar campo 'aprobado' a tabla usuarios
-- Autor: Sistema
-- Fecha: 2025-11-14
-- Descripción: Agrega el campo 'aprobado' para implementar
--              el sistema de aprobación de usuarios por el
--              administrador antes de permitir el acceso
-- =====================================================

USE consorcios_db;

-- Agregar campo 'aprobado' a la tabla usuarios
ALTER TABLE usuarios
ADD COLUMN aprobado BOOLEAN DEFAULT false COMMENT 'Indica si el usuario fue aprobado por el administrador'
AFTER activo;

-- Actualizar usuarios existentes para marcarlos como aprobados
-- (esto es para no bloquear usuarios que ya existen)
UPDATE usuarios
SET aprobado = true
WHERE activo = true;

-- Mensaje de confirmación
SELECT 'Migración completada: Campo aprobado agregado a tabla usuarios' AS status;
