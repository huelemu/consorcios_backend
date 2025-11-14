-- ==============================================
-- Migración: Actualizar tabla proveedores
-- Fecha: 2025-11-14
-- Descripción: Agregar nuevos campos al sistema de proveedores
-- ==============================================

-- 1. Modificar tabla proveedores
ALTER TABLE proveedores
  -- Hacer persona_id opcional (antes era NOT NULL)
  MODIFY COLUMN persona_id INT NULL,

  -- Agregar nuevos campos
  ADD COLUMN tipo_entidad ENUM('fisica', 'juridica') DEFAULT 'fisica' AFTER razon_social,
  ADD COLUMN email_general VARCHAR(150) AFTER cuit,
  ADD COLUMN telefono VARCHAR(50) AFTER email_general,
  ADD COLUMN domicilio VARCHAR(200) AFTER telefono,
  ADD COLUMN localidad VARCHAR(100) AFTER domicilio,
  ADD COLUMN provincia VARCHAR(100) AFTER localidad,
  ADD COLUMN cod_postal VARCHAR(20) AFTER provincia,
  ADD COLUMN condicion_iva ENUM('responsable_inscripto', 'monotributo', 'exento', 'no_categorizado') AFTER cod_postal,

  -- Modificar razon_social para permitir más caracteres
  MODIFY COLUMN razon_social VARCHAR(255),

  -- Modificar rubro para permitir más caracteres
  MODIFY COLUMN rubro VARCHAR(255);

-- 2. Crear tabla de personas vinculadas a proveedores
CREATE TABLE IF NOT EXISTS proveedor_personas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proveedor_id INT NOT NULL,
    persona_id INT NOT NULL,
    rol ENUM('titular', 'responsable_tecnico', 'administrativo', 'contacto_comercial', 'otro') DEFAULT 'titular',
    desde DATE NOT NULL,
    hasta DATE NULL,
    es_principal BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE CASCADE,
    FOREIGN KEY (persona_id) REFERENCES personas(id) ON DELETE CASCADE,
    INDEX idx_proveedor (proveedor_id),
    INDEX idx_persona (persona_id),
    INDEX idx_principal (proveedor_id, es_principal)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Crear tabla de cuentas bancarias de proveedores
CREATE TABLE IF NOT EXISTS proveedor_cuentas_bancarias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proveedor_id INT NOT NULL,
    banco VARCHAR(100),
    titular VARCHAR(200) NOT NULL,
    cuit_titular VARCHAR(20) NOT NULL,
    cbu VARCHAR(22) NOT NULL,
    alias VARCHAR(100),
    tipo_cuenta ENUM('corriente', 'caja_ahorro') DEFAULT 'caja_ahorro',
    moneda ENUM('ARS', 'USD') DEFAULT 'ARS',
    predeterminada BOOLEAN DEFAULT FALSE,
    activa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE CASCADE,
    INDEX idx_proveedor (proveedor_id),
    INDEX idx_cbu (cbu),
    INDEX idx_predeterminada (proveedor_id, predeterminada)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==============================================
-- DATOS DE EJEMPLO (opcional - comentado)
-- ==============================================

-- Descomentar si quieres migrar proveedores existentes
-- Migrar personas vinculadas desde persona_id existente
-- INSERT INTO proveedor_personas (proveedor_id, persona_id, rol, desde, es_principal)
-- SELECT id, persona_id, 'titular', CURDATE(), TRUE
-- FROM proveedores
-- WHERE persona_id IS NOT NULL;

-- ==============================================
-- FIN DE LA MIGRACIÓN
-- ==============================================
