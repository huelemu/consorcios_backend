import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js'; // ✅ mantener coherencia con otros modelos

/**
 * =========================================
 * MODELO: PERSONA
 * =========================================
 * Representa a personas físicas o jurídicas
 */
export const Persona = sequelize.define('Persona', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'El nombre es obligatorio' }
    }
  },
  apellido: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  documento: {  // era "dni"
    type: DataTypes.STRING(20),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: true,
    validate: {
      isEmail: { msg: 'Debe ser un email válido' }
    }
  },
  telefono: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  direccion: {
    type: DataTypes.STRING(150),
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
  pais: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'Argentina'
  },
  tipo_persona: {
    type: DataTypes.ENUM('fisica', 'juridica'),
    defaultValue: 'fisica'
  },
  fecha_creacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'personas',
  timestamps: false,
  indexes: [
    { name: 'idx_persona_documento', fields: ['documento'] },
    { name: 'idx_persona_email', fields: ['email'] }
  ]
});
