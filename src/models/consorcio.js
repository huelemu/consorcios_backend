import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js'; 

/**
 * =========================================
 * MODELO: CONSORCIO
 * =========================================
 * Representa un edificio o conjunto de unidades funcionales
 */
export const Consorcio = sequelize.define('Consorcio', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID del tenant admin que gestiona este consorcio',
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'El nombre del consorcio es obligatorio' },
      len: { args: [3, 100], msg: 'El nombre debe tener entre 3 y 100 caracteres' },
    },
  },
  direccion: {
    type: DataTypes.STRING(150),
    allowNull: true,
  },
  ciudad: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  provincia: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
    codigo_ext: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  pais: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'Argentina',
  },
  cuit: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      is: {
        args: /^\d{2}-\d{8}-\d{1}$/,
        msg: 'El CUIT debe tener el formato XX-XXXXXXXX-X',
      },
    },
  },
  telefono_contacto: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  email_contacto: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      isEmail: { msg: 'Debe ser un email válido' },
    },
  },
  responsable_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Usuario admin_consorcio responsable',
  },
  estado: {
    type: DataTypes.ENUM('activo', 'inactivo'),
    defaultValue: 'activo',
  },
  creado_en: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'consorcios',
  timestamps: false, // Usamos creado_en en lugar de createdAt/updatedAt
  indexes: [
    { name: 'idx_consorcio_estado', fields: ['estado'] },
    { name: 'idx_consorcio_ciudad', fields: ['ciudad'] },
    { name: 'idx_consorcio_responsable', fields: ['responsable_id'] },
  ],
});
