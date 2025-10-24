import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import { Persona } from './persona.js';

export const Usuario = sequelize.define('Usuario', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  persona_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Persona,
      key: 'id'
    }
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(150),
    unique: true,
    allowNull: true
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  rol_global: {
    type: DataTypes.ENUM(
      'admin_global',
      'tenant_admin',
      'admin_consorcio',
      'admin_edificio',
      'proveedor',
      'propietario',
      'inquilino'
    ),
    defaultValue: 'inquilino',
    field: 'rol_global'
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  fecha_creacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'fecha_creacion'
  }
}, {
  tableName: 'usuarios',
  timestamps: false  // ← La BD no tiene createdAt/updatedAt
});