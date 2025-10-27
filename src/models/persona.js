import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Persona = sequelize.define('Persona', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  apellido: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  documento: {  // ✅ CAMBIO: era "dni", ahora "documento"
    type: DataTypes.STRING(20),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  telefono: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  direccion: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  localidad: {  // ✅ NUEVO: faltaba este campo
    type: DataTypes.STRING(100),
    allowNull: true
  },
  provincia: {  // ✅ NUEVO: faltaba este campo
    type: DataTypes.STRING(100),
    allowNull: true
  },
  pais: {  // ✅ NUEVO: faltaba este campo
    type: DataTypes.STRING(50),
    allowNull: true
  },
  tipo_persona: {  // ✅ NUEVO: faltaba este campo
    type: DataTypes.ENUM('fisica', 'juridica'),
    defaultValue: 'fisica'
  },
  fecha_creacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'personas',
  timestamps: false  // La tabla usa 'fecha_creacion' no 'createdAt/updatedAt'
});

export default Persona;