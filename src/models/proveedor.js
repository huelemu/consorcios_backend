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
  tipo_entidad: {
    type: DataTypes.ENUM('fisica', 'juridica'),
    defaultValue: 'fisica'
  },
  cuit: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  rubro: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  email_general: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  telefono: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  domicilio: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  localidad: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  provincia: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  cod_postal: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  condicion_iva: {
    type: DataTypes.ENUM('responsable_inscripto', 'monotributo', 'exento', 'no_categorizado'),
    allowNull: true
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  // Mantener persona_id por compatibilidad
  persona_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'proveedores',
  timestamps: false
});
