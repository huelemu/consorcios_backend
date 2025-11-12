import { DataTypes } from 'sequelize';
import { sequelize } from './index.js';

export const ProveedorCuentaBancaria = sequelize.define('ProveedorCuentaBancaria', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  proveedor_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  banco: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  titular: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  cuit_titular: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  cbu: {
    type: DataTypes.STRING(22),
    allowNull: false
  },
  alias: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  tipo_cuenta: {
    type: DataTypes.ENUM('corriente', 'caja_ahorro'),
    defaultValue: 'caja_ahorro'
  },
  moneda: {
    type: DataTypes.ENUM('ARS', 'USD'),
    defaultValue: 'ARS'
  },
  predeterminada: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  activa: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'proveedor_cuentas_bancarias',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});