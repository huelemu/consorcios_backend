import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

export const TicketComentario = sequelize.define('TicketComentario', {
  id: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true,},
  ticket_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  mensaje: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  interno: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'ticket_comentarios',
  timestamps: true,
  updatedAt: false,
});

