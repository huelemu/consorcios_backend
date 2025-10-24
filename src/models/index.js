import sequelize from '../config/db.js';
import Consorcio from './consorcio.js';
import Unidad from './unidad.js';
import { Persona } from './persona.js';
import { Usuario } from './usuario.js';

// ================================
// Asociaciones (todas acá)
// ================================

// Consorcio ↔ Usuario (responsable opcional)
Consorcio.belongsTo(Usuario, { as: 'responsable', foreignKey: 'responsable_id' });

// Consorcio ↔ Unidad
Consorcio.hasMany(Unidad, { foreignKey: 'consorcio_id', as: 'unidades' });
Unidad.belongsTo(Consorcio, { foreignKey: 'consorcio_id', as: 'consorcio' });

// Persona ↔ Usuario (1:1)
Usuario.belongsTo(Persona, { foreignKey: 'persona_id', as: 'persona' });
Persona.hasOne(Usuario, { foreignKey: 'persona_id', as: 'usuario' });

export {
  sequelize,
  Consorcio,
  Unidad,
  Persona,
  Usuario,
};
