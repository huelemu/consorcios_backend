import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

export const TicketHistorial = sequelize.define('TicketHistorial', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  ticket_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  tipo: {
    type: DataTypes.ENUM('creado', 'actualizado', 'estado', 'asignado', 'comentario', 'adjunto', 'costos'),
    allowNull: false,
  },
  autor: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  mensaje: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  fecha: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
  },
}, {
  tableName: 'ticket_historial',
  timestamps: false,
}); 