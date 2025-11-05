import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

export const TicketAdjunto = sequelize.define('TicketAdjunto', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  ticket_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  nombre_archivo: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  tipo_archivo: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  tamano: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  ruta: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  subido_por: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'ticket_adjuntos',
  timestamps: true,
  updatedAt: false,
});