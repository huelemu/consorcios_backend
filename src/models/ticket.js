import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const TIPOS_TICKET = ['mantenimiento', 'reclamo', 'limpieza', 'administrativo', 'mejora', 'otro'];
const PRIORIDADES_TICKET = ['baja', 'media', 'alta', 'critica'];
const ESTADOS_TICKET = ['abierto', 'en_proceso', 'pendiente', 'resuelto', 'cerrado'];

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
  creador_rol: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'admin_global',
  },
  asignado_a: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  asignado_rol: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  proveedor_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  proveedor_nombre: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  proveedor_rubro: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  tipo: {
    type: DataTypes.ENUM(...TIPOS_TICKET),
    allowNull: false,
    defaultValue: 'otro',
  },
  titulo: {
    type: DataTypes.STRING(255),
    allowNull: false,
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
  estimacion_costo: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  costo_final: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  fecha_creacion: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  fecha_resolucion: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  fecha_cierre: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'tickets',
  timestamps: true,
  indexes: [
    { name: 'idx_tickets_consorcio', fields: ['consorcio_id'] },
    { name: 'idx_tickets_unidad', fields: ['unidad_id'] },
    { name: 'idx_tickets_estado', fields: ['estado'] },
    { name: 'idx_tickets_prioridad', fields: ['prioridad'] },
    { name: 'idx_tickets_tipo', fields: ['tipo'] },
  ],
});

export const TICKET_CONSTANTS = {
  TIPOS_TICKET,
  PRIORIDADES_TICKET,
  ESTADOS_TICKET,
};