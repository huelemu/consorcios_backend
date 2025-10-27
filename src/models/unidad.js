import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

/**
 * =========================================
 * MODELO UNIDAD FUNCIONAL
 * =========================================
 * Representa una unidad funcional dentro de un consorcio
 */
const Unidad = sequelize.define('Unidad', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    comment: 'ID único de la unidad'
  },
  consorcio_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID del consorcio al que pertenece'
  },
  codigo: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Código único de la unidad (ej: A-101, B-202)'
  },
  piso: {
    type: DataTypes.STRING(10),
    allowNull: false,
    comment: 'Piso de la unidad (ej: 1, PB, Subsuelo)'
  },
  superficie: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Superficie en metros cuadrados'
  },
  porcentaje_participacion: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'Porcentaje de participación en expensas (0-100)'
  },
  estado: {
    type: DataTypes.ENUM('ocupado', 'vacante', 'mantenimiento'),
    defaultValue: 'vacante',
    allowNull: false,
    comment: 'Estado actual de la unidad'
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Descripción adicional de la unidad'
  }
}, {
  tableName: 'unidades_funcionales',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true,
  comment: 'Tabla de unidades funcionales'
});

export default Unidad;