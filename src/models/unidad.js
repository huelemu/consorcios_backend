import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Unidad = sequelize.define('Unidad', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  consorcio_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  codigo: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  piso: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  superficie: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  porcentaje_participacion: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
  },
  estado: {
    type: DataTypes.ENUM('activo', 'inactivo'),
    defaultValue: 'activo',
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'unidades_funcionales',
  timestamps: true,
});

export default Unidad;
