import { DataTypes } from 'sequelize';
import { sequelize } from './index.js';

export const ConsorcioProveedor = sequelize.define('ConsorcioProveedor', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  consorcio_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  proveedor_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  servicio: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  estado: {
    type: DataTypes.ENUM('activo', 'inactivo'),
    defaultValue: 'activo'
  }
}, {
  tableName: 'consorcios_proveedores',
  timestamps: false
}); 
