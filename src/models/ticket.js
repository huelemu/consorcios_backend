import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const TIPOS_TICKET = ['mantenimiento', 'reclamo', 'administrativo', 'otro'];
const PRIORIDADES_TICKET = ['baja', 'media', 'alta', 'crítica'];
const ESTADOS_TICKET = ['abierto', 'en_proceso', 'resuelto', 'cerrado'];

export const Ticket = sequelize.define('Ticket', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  consorcio_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  unidad_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  creado_por: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  asignado_a: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  tipo: {
    type: DataTypes.ENUM(...TIPOS_TICKET),
    allowNull: false,
    defaultValue: 'otro',
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  prioridad: {
    type: DataTypes.ENUM(...PRIORIDADES_TICKET),
    allowNull: false,
    defaultValue: 'media',
  },
  estado: {
    type: DataTypes.ENUM(...ESTADOS_TICKET),
    allowNull: false,
    defaultValue: 'abierto',
  },
  fecha_creacion: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  fecha_cierre: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'tickets',
  timestamps: false,
  indexes: [
    { name: 'idx_tickets_consorcio', fields: ['consorcio_id'] },
    { name: 'idx_tickets_estado', fields: ['estado'] },
    { name: 'idx_tickets_prioridad', fields: ['prioridad'] },
  ],
});

export const TICKET_CONSTANTS = {
  TIPOS_TICKET,
  PRIORIDADES_TICKET,
  ESTADOS_TICKET,
};