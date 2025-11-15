import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

export const RolModulo = sequelize.define('RolModulo', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  rol_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'roles',
      key: 'id'
    },
    comment: 'ID del rol'
  },
  modulo_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'modulos',
      key: 'id'
    },
    comment: 'ID del módulo'
  },
  puede_ver: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Si el rol puede ver el módulo'
  },
  puede_crear: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Si el rol puede crear registros en el módulo'
  },
  puede_editar: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Si el rol puede editar registros en el módulo'
  },
  puede_eliminar: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Si el rol puede eliminar registros en el módulo'
  }
}, {
  tableName: 'roles_modulos',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['rol_id', 'modulo_id'],
      name: 'unique_rol_modulo'
    }
  ]
});
