import { DataTypes } from 'sequelize';
import { sequelize } from './index.js';

export const ProveedorPersona = sequelize.define('ProveedorPersona', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  proveedor_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  persona_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  rol: {
    type: DataTypes.ENUM('titular', 'responsable_tecnico', 'administrativo', 'contacto_comercial', 'otro'),
    defaultValue: 'titular'
  },
  desde: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  hasta: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  es_principal: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'proveedor_personas',
  timestamps: false
});