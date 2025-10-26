-- ==============================================
-- Base de datos: consorcios_dev
-- Autor: Juan M. Lacy
-- Fecha: 2025-10-22
-- ==============================================


-- CREATE DATABASE IF NOT EXISTS consorcio_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE consorcio_dev;
SHOW TABLES;

-- ==============================================
-- Tabla: personas
-- ==============================================
CREATE TABLE personas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100),
    documento VARCHAR(20),
    email VARCHAR(150),
    telefono VARCHAR(50),
    direccion VARCHAR(150),
    localidad VARCHAR(100),
    provincia VARCHAR(100),
    pais VARCHAR(50),
    tipo_persona ENUM('fisica', 'juridica') DEFAULT 'fisica',
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==============================================
-- Tabla: usuarios
-- ==============================================
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    persona_id INT NOT NULL,
    username VARCHAR(50),
    email VARCHAR(150) UNIQUE,
    password VARCHAR(255),
    rol_global ENUM('admin_global','tenant_admin','admin_consorcio','admin_edificio','proveedor','propietario','inquilino') DEFAULT 'inquilino',
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    google_id VARCHAR(255) NULL UNIQUE,
    oauth_provider ENUM('local', 'google', 'microsoft') DEFAULT 'local',
	email_verificado BOOLEAN DEFAULT FALSE COMMENT 'Indica si el email fue verificado', 
	primer_login BOOLEAN DEFAULT TRUE,
	invitacion_token VARCHAR(255) NULL,
	invitacion_expira DATETIME NULL;
    FOREIGN KEY (persona_id) REFERENCES personas(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX IF NOT EXISTS idx_google_id ON usuarios(google_id);
CREATE INDEX IF NOT EXISTS idx_oauth_provider ON usuarios(oauth_provider);
CREATE INDEX IF NOT EXISTS idx_email ON usuarios(email);



-- ==============================================
-- Tabla: roles
-- ==============================================
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE,
    descripcion VARCHAR(200)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO roles (nombre, descripcion) VALUES
('admin_global', 'Control total del sistema'),
('tenant_admin', 'Administrador de grupo de consorcios'),
('admin_consorcio', 'Administrador de 1 o varios consorcios'),
('admin_edificio', 'Administrador de edificio individual'),
('propietario', 'Dueño de unidad funcional'),
('inquilino', 'Arrendatario'),
('proveedor', 'Proveedor o contratista');

-- ==============================================
-- Tabla: usuarios_roles
-- ==============================================
CREATE TABLE usuarios_roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    rol_id INT NOT NULL,
    consorcio_id INT NULL,
    unidad_id INT NULL,
    activo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==============================================
-- Tabla: consorcios
-- ==============================================
CREATE TABLE consorcios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NULL,
    nombre VARCHAR(100) NOT NULL,
    direccion VARCHAR(150),
    ciudad VARCHAR(100),
    provincia VARCHAR(100),
    pais VARCHAR(50),
    cuit VARCHAR(20),
    telefono_contacto VARCHAR(50),
    email_contacto VARCHAR(100),
    responsable_id INT NULL,
    estado ENUM('activo','inactivo') DEFAULT 'activo',
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (responsable_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==============================================
-- Tabla: unidades_funcionales
-- ==============================================
CREATE TABLE unidades_funcionales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    consorcio_id INT NOT NULL,
    codigo VARCHAR(20) NOT NULL,
    piso VARCHAR(10),
    superficie DECIMAL(8,2),
    porcentaje_participacion DECIMAL(5,2),
    estado ENUM('ocupado','vacante','mantenimiento') DEFAULT 'ocupado',
    FOREIGN KEY (consorcio_id) REFERENCES consorcios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==============================================
-- Tabla: personas_unidades_funcionales
-- ==============================================
CREATE TABLE personas_unidades_funcionales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    persona_id INT NOT NULL,
    unidad_id INT NOT NULL,
    rol_unidad ENUM('propietario','inquilino','responsable','otro') DEFAULT 'otro',
    fecha_desde DATE,
    fecha_hasta DATE NULL,
    FOREIGN KEY (persona_id) REFERENCES personas(id) ON DELETE CASCADE,
    FOREIGN KEY (unidad_id) REFERENCES unidades_funcionales(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==============================================
-- Tabla: proveedores
-- ==============================================
CREATE TABLE proveedores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    persona_id INT NOT NULL,
    razon_social VARCHAR(150),
    cuit VARCHAR(20),
    rubro VARCHAR(100),
    observaciones TEXT,
    activo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (persona_id) REFERENCES personas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==============================================
-- Tabla: consorcios_proveedores
-- ==============================================
CREATE TABLE consorcios_proveedores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    consorcio_id INT NOT NULL,
    proveedor_id INT NOT NULL,
    servicio VARCHAR(150),
    contrato_desde DATE,
    contrato_hasta DATE NULL,
    estado ENUM('activo','inactivo') DEFAULT 'activo',
    FOREIGN KEY (consorcio_id) REFERENCES consorcios(id) ON DELETE CASCADE,
    FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==============================================
-- Tabla: expensas
-- ==============================================
CREATE TABLE expensas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    unidad_id INT NOT NULL,
    periodo VARCHAR(7) NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    fecha_emision DATE DEFAULT CURRENT_DATE,
    fecha_vencimiento DATE,
    pagado BOOLEAN DEFAULT FALSE,
    fecha_pago DATE NULL,
    metodo_pago VARCHAR(50),
    comprobante_url VARCHAR(255),
    FOREIGN KEY (unidad_id) REFERENCES unidades_funcionales(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==============================================
-- Tabla: tickets (reclamos)
-- ==============================================
CREATE TABLE tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    consorcio_id INT NOT NULL,
    unidad_id INT NULL,
    creado_por INT NOT NULL,
    asignado_a INT NULL,
    tipo ENUM('mantenimiento','reclamo','administrativo','otro') DEFAULT 'otro',
    descripcion TEXT,
    prioridad ENUM('baja','media','alta','crítica') DEFAULT 'media',
    estado ENUM('abierto','en_proceso','resuelto','cerrado') DEFAULT 'abierto',
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_cierre DATETIME NULL,
    FOREIGN KEY (consorcio_id) REFERENCES consorcios(id) ON DELETE CASCADE,
    FOREIGN KEY (unidad_id) REFERENCES unidades_funcionales(id) ON DELETE SET NULL,
    FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (asignado_a) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==============================================
-- Tabla: notificaciones
-- ==============================================
CREATE TABLE notificaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    mensaje TEXT,
    tipo ENUM('ticket','expensa','sistema','otro') DEFAULT 'otro',
    leido BOOLEAN DEFAULT FALSE,
    fecha_envio DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
