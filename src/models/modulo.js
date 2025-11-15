import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

export const Modulo = sequelize.define('Modulo', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: 'Nombre del módulo (ej: Dashboard, Usuarios, Consorcios)'
  },
  clave: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: 'Identificador único del módulo (ej: dashboard, usuarios, consorcios)'
  },
  descripcion: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: 'Descripción del módulo'
  },
  icono: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Nombre del icono (ej: dashboard, people, building)'
  },
  ruta: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Ruta del frontend (ej: /dashboard, /usuarios)'
  },
  orden: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Orden de visualización en el menú'
  },
  activo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Si el módulo está activo o no'
  },
  requiere_consorcio: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Si el módulo requiere contexto de consorcio'
  }
}, {
  tableName: 'modulos',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});
