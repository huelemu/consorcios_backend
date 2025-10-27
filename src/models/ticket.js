import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

export const Ticket = sequelize.define('ticket', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  unidad_id: { type: DataTypes.INTEGER },
  descripcion: { type: DataTypes.STRING },
  estado: { type: DataTypes.STRING },
});
