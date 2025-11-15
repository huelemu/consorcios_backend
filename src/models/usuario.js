import { DataTypes } from 'sequelize';
import { sequelize } from './index.js';

export const Usuario = sequelize.define('Usuario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  persona_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'personas',
      key: 'id'
    }
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: true // Puede ser null si usa OAuth
  },
  rol_global: {
    type: DataTypes.ENUM(
      'admin_global',
      'tenant_admin',
      'admin_consorcio',
      'admin_edificio',
      'proveedor',
      'propietario',
      'inquilino',
      'usuario_pendiente'
    ),
    defaultValue: 'usuario_pendiente'
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: false // Inactivo hasta que se active
  },
  aprobado: {
    type: DataTypes.BOOLEAN,
    defaultValue: false // Requiere aprobación del administrador
  },

  // ======== CAMPOS OAUTH (agregados por ALTER TABLE) ========
  google_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true
  },
  oauth_provider: {
    type: DataTypes.ENUM('local', 'google', 'microsoft'),
    defaultValue: 'local'
  },
  email_verificado: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  primer_login: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  
  // ======== INVITACIÓN (agregados por ALTER TABLE) ========
  invitacion_token: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true
  },
  invitacion_expira: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  fecha_creacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'usuarios',
  timestamps: false // La tabla usa 'fecha_creacion' no 'createdAt/updatedAt'
});