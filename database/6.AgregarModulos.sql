-- ==============================================
-- Migración: Sistema de Módulos y Permisos
-- Autor: Sistema
-- Fecha: 2025-11-15
-- Descripción: Agrega tablas para gestión de módulos
--              y permisos por rol
-- ==============================================

-- ==============================================
-- Tabla: modulos
-- Descripción: Almacena los módulos del sistema
-- ==============================================
CREATE TABLE IF NOT EXISTS modulos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL COMMENT 'Nombre del módulo (ej: Dashboard, Usuarios)',
    clave VARCHAR(50) NOT NULL UNIQUE COMMENT 'Identificador único (ej: dashboard, usuarios)',
    descripcion VARCHAR(200) NULL COMMENT 'Descripción del módulo',
    icono VARCHAR(50) NULL COMMENT 'Nombre del icono (ej: dashboard, people, building)',
    ruta VARCHAR(100) NULL COMMENT 'Ruta del frontend (ej: /dashboard, /usuarios)',
    orden INT NOT NULL DEFAULT 0 COMMENT 'Orden de visualización en el menú',
    activo BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Si el módulo está activo',
    requiere_consorcio BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Si requiere contexto de consorcio',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_clave (clave),
    INDEX idx_activo (activo),
    INDEX idx_orden (orden)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Módulos del sistema';

-- ==============================================
-- Tabla: roles_modulos
-- Descripción: Relación N:M entre roles y módulos
--              Define qué módulos puede ver/usar cada rol
-- ==============================================
CREATE TABLE IF NOT EXISTS roles_modulos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rol_id INT NOT NULL COMMENT 'ID del rol',
    modulo_id INT NOT NULL COMMENT 'ID del módulo',
    puede_ver BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Si puede ver el módulo',
    puede_crear BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Si puede crear registros',
    puede_editar BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Si puede editar registros',
    puede_eliminar BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Si puede eliminar registros',
    FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (modulo_id) REFERENCES modulos(id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY unique_rol_modulo (rol_id, modulo_id),
    INDEX idx_rol_id (rol_id),
    INDEX idx_modulo_id (modulo_id),
    INDEX idx_puede_ver (puede_ver)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Permisos de roles sobre módulos';

-- ==============================================
-- Verificación de tablas creadas
-- ==============================================
SELECT 'Tabla modulos creada' AS Resultado FROM DUAL WHERE EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = DATABASE()
    AND table_name = 'modulos'
);

SELECT 'Tabla roles_modulos creada' AS Resultado FROM DUAL WHERE EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = DATABASE()
    AND table_name = 'roles_modulos'
);

-- ==============================================
-- Datos iniciales de módulos (opcional)
-- Se recomienda usar el seeder modulosSeeder.js
-- ==============================================
INSERT INTO modulos (nombre, clave, descripcion, icono, ruta, orden, activo, requiere_consorcio) VALUES
('Dashboard', 'dashboard', 'Panel de control con estadísticas y resumen', 'dashboard', '/dashboard', 1, TRUE, FALSE),
('Consorcios', 'consorcios', 'Gestión de consorcios', 'building', '/consorcios', 2, TRUE, FALSE),
('Unidades', 'unidades', 'Gestión de unidades funcionales', 'apartment', '/unidades', 3, TRUE, TRUE),
('Personas', 'personas', 'Gestión de personas (propietarios, inquilinos)', 'people', '/personas', 4, TRUE, FALSE),
('Usuarios', 'usuarios', 'Gestión de usuarios del sistema', 'person', '/usuarios', 5, TRUE, FALSE),
('Proveedores', 'proveedores', 'Gestión de proveedores', 'store', '/proveedores', 6, TRUE, FALSE),
('Expensas', 'expensas', 'Gestión de expensas', 'receipt', '/expensas', 7, TRUE, TRUE),
('Tickets', 'tickets', 'Sistema de tickets y solicitudes', 'support', '/tickets', 8, TRUE, FALSE)
ON DUPLICATE KEY UPDATE
    nombre = VALUES(nombre),
    descripcion = VALUES(descripcion),
    icono = VALUES(icono),
    ruta = VALUES(ruta),
    orden = VALUES(orden),
    activo = VALUES(activo),
    requiere_consorcio = VALUES(requiere_consorcio);

-- ==============================================
-- Permisos por defecto para admin_global
-- ==============================================
INSERT INTO roles_modulos (rol_id, modulo_id, puede_ver, puede_crear, puede_editar, puede_eliminar)
SELECT r.id, m.id, TRUE, TRUE, TRUE, TRUE
FROM roles r
CROSS JOIN modulos m
WHERE r.nombre = 'admin_global'
ON DUPLICATE KEY UPDATE
    puede_ver = VALUES(puede_ver),
    puede_crear = VALUES(puede_crear),
    puede_editar = VALUES(puede_editar),
    puede_eliminar = VALUES(puede_eliminar);

-- ==============================================
-- Permisos por defecto para tenant_admin
-- ==============================================
INSERT INTO roles_modulos (rol_id, modulo_id, puede_ver, puede_crear, puede_editar, puede_eliminar)
SELECT r.id, m.id,
    TRUE,
    CASE WHEN m.clave IN ('consorcios', 'unidades', 'personas', 'usuarios', 'proveedores', 'expensas', 'tickets') THEN TRUE ELSE FALSE END,
    CASE WHEN m.clave IN ('consorcios', 'unidades', 'personas', 'usuarios', 'proveedores', 'expensas', 'tickets') THEN TRUE ELSE FALSE END,
    CASE WHEN m.clave IN ('consorcios', 'unidades', 'proveedores') THEN TRUE ELSE FALSE END
FROM roles r
CROSS JOIN modulos m
WHERE r.nombre = 'tenant_admin'
ON DUPLICATE KEY UPDATE
    puede_ver = VALUES(puede_ver),
    puede_crear = VALUES(puede_crear),
    puede_editar = VALUES(puede_editar),
    puede_eliminar = VALUES(puede_eliminar);

-- ==============================================
-- Permisos por defecto para admin_consorcio
-- ==============================================
INSERT INTO roles_modulos (rol_id, modulo_id, puede_ver, puede_crear, puede_editar, puede_eliminar)
SELECT r.id, m.id,
    CASE WHEN m.clave IN ('dashboard', 'consorcios', 'unidades', 'personas', 'proveedores', 'expensas', 'tickets') THEN TRUE ELSE FALSE END,
    CASE WHEN m.clave IN ('unidades', 'personas', 'proveedores', 'expensas', 'tickets') THEN TRUE ELSE FALSE END,
    CASE WHEN m.clave IN ('consorcios', 'unidades', 'personas', 'proveedores', 'expensas', 'tickets') THEN TRUE ELSE FALSE END,
    CASE WHEN m.clave IN ('unidades') THEN TRUE ELSE FALSE END
FROM roles r
CROSS JOIN modulos m
WHERE r.nombre = 'admin_consorcio'
ON DUPLICATE KEY UPDATE
    puede_ver = VALUES(puede_ver),
    puede_crear = VALUES(puede_crear),
    puede_editar = VALUES(puede_editar),
    puede_eliminar = VALUES(puede_eliminar);

-- ==============================================
-- Permisos por defecto para propietario
-- ==============================================
INSERT INTO roles_modulos (rol_id, modulo_id, puede_ver, puede_crear, puede_editar, puede_eliminar)
SELECT r.id, m.id,
    CASE WHEN m.clave IN ('dashboard', 'consorcios', 'unidades', 'expensas', 'tickets') THEN TRUE ELSE FALSE END,
    CASE WHEN m.clave IN ('tickets') THEN TRUE ELSE FALSE END,
    FALSE,
    FALSE
FROM roles r
CROSS JOIN modulos m
WHERE r.nombre = 'propietario'
ON DUPLICATE KEY UPDATE
    puede_ver = VALUES(puede_ver),
    puede_crear = VALUES(puede_crear),
    puede_editar = VALUES(puede_editar),
    puede_eliminar = VALUES(puede_eliminar);

-- ==============================================
-- Permisos por defecto para inquilino
-- ==============================================
INSERT INTO roles_modulos (rol_id, modulo_id, puede_ver, puede_crear, puede_editar, puede_eliminar)
SELECT r.id, m.id,
    CASE WHEN m.clave IN ('dashboard', 'consorcios', 'unidades', 'expensas', 'tickets') THEN TRUE ELSE FALSE END,
    CASE WHEN m.clave IN ('tickets') THEN TRUE ELSE FALSE END,
    FALSE,
    FALSE
FROM roles r
CROSS JOIN modulos m
WHERE r.nombre = 'inquilino'
ON DUPLICATE KEY UPDATE
    puede_ver = VALUES(puede_ver),
    puede_crear = VALUES(puede_crear),
    puede_editar = VALUES(puede_editar),
    puede_eliminar = VALUES(puede_eliminar);

-- ==============================================
-- Permisos por defecto para proveedor
-- ==============================================
INSERT INTO roles_modulos (rol_id, modulo_id, puede_ver, puede_crear, puede_editar, puede_eliminar)
SELECT r.id, m.id,
    CASE WHEN m.clave IN ('tickets') THEN TRUE ELSE FALSE END,
    FALSE,
    CASE WHEN m.clave IN ('tickets') THEN TRUE ELSE FALSE END,
    FALSE
FROM roles r
CROSS JOIN modulos m
WHERE r.nombre = 'proveedor'
ON DUPLICATE KEY UPDATE
    puede_ver = VALUES(puede_ver),
    puede_crear = VALUES(puede_crear),
    puede_editar = VALUES(puede_editar),
    puede_eliminar = VALUES(puede_eliminar);

-- ==============================================
-- Verificación final
-- ==============================================
SELECT
    r.nombre AS Rol,
    COUNT(DISTINCT rm.modulo_id) AS Modulos_Asignados,
    SUM(rm.puede_ver) AS Puede_Ver,
    SUM(rm.puede_crear) AS Puede_Crear,
    SUM(rm.puede_editar) AS Puede_Editar,
    SUM(rm.puede_eliminar) AS Puede_Eliminar
FROM roles r
LEFT JOIN roles_modulos rm ON r.id = rm.rol_id
GROUP BY r.id, r.nombre
ORDER BY r.nombre;

SELECT 'Migración completada exitosamente' AS Estado;
