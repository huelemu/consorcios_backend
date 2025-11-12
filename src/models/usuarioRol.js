import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

export const UsuarioRol = sequelize.define('UsuarioRol', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id'
    }
  },
  rol_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'roles',
      key: 'id'
    }
  },
  consorcio_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'consorcios',
      key: 'id'
    }
  },
  unidad_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'unidades_funcionales',
      key: 'id'
    }
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'usuarios_roles',
  timestamps: false
});
