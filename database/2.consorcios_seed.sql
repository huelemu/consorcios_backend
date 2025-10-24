USE consorcio_dev;

-- ==============================================
-- ROLES BASE
-- ==============================================
INSERT IGNORE INTO roles (nombre, descripcion) VALUES
('admin_global', 'Control total del sistema'),
('tenant_admin', 'Administrador de grupo de consorcios'),
('admin_consorcio', 'Administrador de 1 o varios consorcios'),
('admin_edificio', 'Administrador de edificio individual'),
('propietario', 'Dueño de unidad funcional'),
('inquilino', 'Arrendatario'),
('proveedor', 'Proveedor o contratista');

-- ==============================================
-- PERSONAS BASE
-- ==============================================
INSERT INTO personas (nombre, apellido, documento, email, telefono, direccion, localidad, provincia, pais, tipo_persona)
VALUES
('Juan', 'Lacy', '30123123', 'juan@consorcios.com', '+54 11 5555-1111', 'Av. Mitre 123', 'Avellaneda', 'Buenos Aires', 'Argentina', 'fisica'), -- Admin Global
('Lucía', 'Torres', '29399111', 'lucia@adminflota.com', '+54 11 5555-2222', 'Av. Santa Fe 500', 'CABA', 'Buenos Aires', 'Argentina', 'fisica'), -- Tenant Admin
('Carlos', 'Gómez', '32222444', 'carlos@consorcioa.com', '+54 11 5555-3333', 'Libertad 1200', 'CABA', 'Buenos Aires', 'Argentina', 'fisica'), -- Admin Consorcio
('María', 'Ríos', '23333999', 'maria@edificio.com', '+54 11 5555-4444', 'Corrientes 999', 'CABA', 'Buenos Aires', 'Argentina', 'fisica'), -- Admin Edificio
('Pedro', 'Suárez', '40111888', 'pedro@vecino.com', '+54 11 5555-5555', 'Av. Siempre Viva 742', 'CABA', 'Buenos Aires', 'Argentina', 'fisica'), -- Propietario
('Laura', 'Pérez', '41111222', 'laura@inquilina.com', '+54 11 5555-6666', 'Av. Siempre Viva 742', 'CABA', 'Buenos Aires', 'Argentina', 'fisica'), -- Inquilina
('Electricidad', 'S.R.L.', '30789999876', 'contacto@electrosrl.com', '+54 11 5555-7777', 'Warnes 320', 'CABA', 'Buenos Aires', 'Argentina', 'juridica'); -- Proveedor

-- ==============================================
-- USUARIOS
-- ==============================================
INSERT INTO usuarios (persona_id, username, email, password, rol_global, activo)
VALUES
(1, 'admin_global', 'juan@consorcios.com', '$2b$10$abc123456789012345678uK9eXlT7Pjsf3/fakehashdemo', 'admin_global', TRUE),
(2, 'tenant_admin', 'lucia@adminflota.com', '$2b$10$abc123456789012345678uK9eXlT7Pjsf3/fakehashdemo', 'tenant_admin', TRUE),
(3, 'admin_consorcio', 'carlos@consorcioa.com', '$2b$10$abc123456789012345678uK9eXlT7Pjsf3/fakehashdemo', 'admin_consorcio', TRUE),
(4, 'admin_edificio', 'maria@edificio.com', '$2b$10$abc123456789012345678uK9eXlT7Pjsf3/fakehashdemo', 'admin_edificio', TRUE),
(5, 'propietario', 'pedro@vecino.com', '$2b$10$abc123456789012345678uK9eXlT7Pjsf3/fakehashdemo', 'propietario', TRUE),
(6, 'inquilino', 'laura@inquilina.com', '$2b$10$abc123456789012345678uK9eXlT7Pjsf3/fakehashdemo', 'inquilino', TRUE),
(7, 'proveedor', 'contacto@electrosrl.com', '$2b$10$abc123456789012345678uK9eXlT7Pjsf3/fakehashdemo', 'proveedor', TRUE);

-- ==============================================
-- ASIGNAR ROLES ESPECÍFICOS (usuarios_roles)
-- ==============================================
INSERT INTO usuarios_roles (usuario_id, rol_id, activo)
SELECT u.id, r.id, TRUE
FROM usuarios u
JOIN roles r ON r.nombre = u.rol_global;

-- ==============================================
-- CREAR CONSORCIO Y UNIDADES
-- ==============================================
INSERT INTO consorcios (tenant_id, nombre, direccion, ciudad, provincia, pais, cuit, telefono_contacto, email_contacto, responsable_id, estado)
VALUES
(2, 'Edificio Libertad', 'Libertad 1200', 'CABA', 'Buenos Aires', 'Argentina', '30-12345678-9', '+54 11 5555-8888', 'contacto@libertad.com', 3, 'activo');

INSERT INTO unidades_funcionales (consorcio_id, codigo, piso, superficie, porcentaje_participacion, estado)
VALUES
(1, 'A-101', '1', 65.5, 4.2, 'ocupado'),
(1, 'B-202', '2', 80.0, 5.8, 'ocupado');

-- ==============================================
-- RELACIONAR PERSONAS CON UNIDADES
-- ==============================================
INSERT INTO personas_unidades_funcionales (persona_id, unidad_id, rol_unidad, fecha_desde)
VALUES
(5, 1, 'propietario', '2024-01-01'),
(6, 1, 'inquilino', '2024-03-01'),
(5, 2, 'propietario', '2024-06-01');

-- ==============================================
-- PROVEEDORES Y RELACIÓN CON CONSORCIO
-- ==============================================
INSERT INTO proveedores (persona_id, razon_social, cuit, rubro, observaciones, activo)
VALUES
(7, 'Electricidad S.R.L.', '30-78999987-6', 'Electricidad', 'Servicio eléctrico general', TRUE);

INSERT INTO consorcios_proveedores (consorcio_id, proveedor_id, servicio, contrato_desde, estado)
VALUES
(1, 1, 'Mantenimiento eléctrico', '2024-01-15', 'activo');

-- ==============================================
-- EXPENSAS DEMO
-- ==============================================
INSERT INTO expensas (unidad_id, periodo, monto, fecha_vencimiento, pagado)
VALUES
(1, '2025-09', 25000.00, '2025-09-30', TRUE),
(2, '2025-09', 32000.00, '2025-09-30', FALSE);

-- ==============================================
-- TICKETS DEMO
-- ==============================================
INSERT INTO tickets (consorcio_id, unidad_id, creado_por, asignado_a, tipo, descripcion, prioridad, estado)
VALUES
(1, 1, 5, 4, 'mantenimiento', 'La luz del pasillo no funciona', 'media', 'en_proceso'),
(1, 2, 6, 4, 'reclamo', 'Humedad en la pared del baño', 'alta', 'abierto');

-- ==============================================
-- NOTIFICACIONES DEMO
-- ==============================================
INSERT INTO notificaciones (usuario_id, mensaje, tipo, leido)
VALUES
(4, 'Nuevo reclamo asignado: luz del pasillo', 'ticket', FALSE),
(5, 'Su expensa del período 2025-09 está pagada', 'expensa', TRUE),
(6, 'Expensa del período 2025-09 pendiente de pago', 'expensa', FALSE);
