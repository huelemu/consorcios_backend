import { DataTypes } from 'sequelize';
import { sequelize } from './index.js';

export const Proveedor = sequelize.define('Proveedor', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  razon_social: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  rubro: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  persona_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'proveedores',
  timestamps: false
});
