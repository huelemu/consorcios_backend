import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Consorcio = sequelize.define('Consorcio', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  direccion: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  responsable_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  estado: {
    type: DataTypes.ENUM('activo', 'inactivo'),
    defaultValue: 'activo',
  },
}, {
  tableName: 'consorcios',
  timestamps: true,
});

export default Consorcio;
