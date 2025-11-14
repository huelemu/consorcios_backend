-- ==============================================
-- FIX URGENTE: Hacer persona_id nullable en proveedores
-- ==============================================
-- Este fix es necesario para poder crear proveedores sin persona_id
-- El modelo ya no requiere persona_id obligatorio, pero la DB sí

ALTER TABLE proveedores
  MODIFY COLUMN persona_id INT NULL;

-- Verificar el cambio
DESCRIBE proveedores;
